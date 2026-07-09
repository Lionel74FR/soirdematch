import type { Answers } from "@/lib/questionnaire";

export interface MatchParticipant {
  id: string;
  gender: string | null;
  birthYear: number | null;
  answers: Answers;
}

export type MatchWeights = Record<string, number>;

export interface MatchingStrategy {
  hardFilters?: string[];
  weights?: MatchWeights;
}

export interface PairResult {
  a: string;
  b: string;
  score: number; // 0..100
}

/** Stratégie par défaut si events.matching_strategy est absent. */
export const DEFAULT_STRATEGY: MatchingStrategy = {
  hardFilters: ["seeking", "ageRange", "birthYear", "smokingDealbreaker"],
  weights: { relationType: 20, values: 14, interests: 12, socialEnergy: 10 },
};

const currentYear = new Date().getFullYear();

function ageOf(p: MatchParticipant): number | null {
  return p.birthYear ? currentYear - p.birthYear : null;
}

function asStr(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function parseAgeRange(value: string): [number, number] | null {
  if (!value) return null;
  if (value.endsWith("+")) {
    const min = parseInt(value, 10);
    return Number.isFinite(min) ? [min, 200] : null;
  }
  const parts = value.split("-").map((n) => parseInt(n, 10));
  if (parts.length !== 2 || !Number.isFinite(parts[0]) || !Number.isFinite(parts[1])) {
    return null;
  }
  return [parts[0], parts[1]];
}

function seekMatches(seeking: string, gender: string | null): boolean {
  if (!gender) return false;
  if (seeking === "les_deux") return true;
  if (seeking === "hommes") return gender === "homme";
  if (seeking === "femmes") return gender === "femme";
  return false;
}

/**
 * Filtres durs — éliminent les paires impossibles.
 * 1. Orientation mutuelle (seeking ↔ gender, dans les deux sens).
 * 2. Tranche d'âge mutuelle (l'âge réel de chacun doit entrer dans la
 *    fourchette souhaitée par l'autre).
 * 3. Tabac rédhibitoire : préférences directement opposées = incompatible.
 *    (Le questionnaire ne capture pas « êtes-vous fumeur ? » ; on traite donc
 *    la divergence de préférence comme le critère rédhibitoire disponible.)
 */
export function passesHardFilters(a: MatchParticipant, b: MatchParticipant): boolean {
  const aSeek = asStr(a.answers.seeking);
  const bSeek = asStr(b.answers.seeking);
  if (!seekMatches(aSeek, b.gender) || !seekMatches(bSeek, a.gender)) return false;

  const aAge = ageOf(a);
  const bAge = ageOf(b);
  const aRange = parseAgeRange(asStr(a.answers.ageRange));
  const bRange = parseAgeRange(asStr(b.answers.ageRange));
  if (aRange && bAge != null && (bAge < aRange[0] || bAge > aRange[1])) return false;
  if (bRange && aAge != null && (aAge < bRange[0] || aAge > bRange[1])) return false;

  const aSmoke = asStr(a.answers.smokingDealbreaker);
  const bSmoke = asStr(b.answers.smokingDealbreaker);
  if (
    (aSmoke === "oui" && bSmoke === "non") ||
    (aSmoke === "non" && bSmoke === "oui")
  ) {
    return false;
  }

  return true;
}

const RELATION_ORDER: Record<string, number> = {
  serieuse: 3,
  on_verra: 2,
  legere: 1,
};

function relationSim(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  // « amitié » est qualitativement éloignée des intentions amoureuses.
  if (a === "amitie" || b === "amitie") return 0.1;
  const ra = RELATION_ORDER[a];
  const rb = RELATION_ORDER[b];
  if (ra == null || rb == null) return 0;
  return 1 - Math.abs(ra - rb) / 2;
}

function jaccard(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 0;
  const setB = new Set(b);
  const inter = a.filter((x) => setB.has(x)).length;
  const union = new Set([...a, ...b]).size;
  return union === 0 ? 0 : inter / union;
}

const ENERGY_ORDER: Record<string, number> = {
  reserve: 0,
  equilibre: 1,
  extraverti: 2,
};

function energySim(a: string, b: string): number {
  const ea = ENERGY_ORDER[a];
  const eb = ENERGY_ORDER[b];
  if (ea == null || eb == null) return 0;
  return 1 - Math.abs(ea - eb) / 2;
}

/** Score pondéré 0..100 sur les dimensions d'affinité. */
export function pairScore(
  a: MatchParticipant,
  b: MatchParticipant,
  weights: MatchWeights,
): number {
  const sims: Record<string, number> = {
    relationType: relationSim(
      asStr(a.answers.relationType),
      asStr(b.answers.relationType),
    ),
    values: jaccard(asArr(a.answers.values), asArr(b.answers.values)),
    interests: jaccard(asArr(a.answers.interests), asArr(b.answers.interests)),
    socialEnergy: energySim(
      asStr(a.answers.socialEnergy),
      asStr(b.answers.socialEnergy),
    ),
  };

  let totalW = 0;
  let acc = 0;
  for (const [dim, w] of Object.entries(weights)) {
    if (!(dim in sims) || !w) continue;
    totalW += w;
    acc += w * sims[dim];
  }
  if (totalW === 0) return 0;
  return Math.round((acc / totalW) * 1000) / 10;
}

export interface GroupResult {
  index: number; // numéro de groupe 1..k (= numéro de badge)
  memberIds: string[];
  pairs: PairResult[]; // paires intra-groupe avec leur score
  avgScore: number; // affinité moyenne du groupe (0..100)
}

/** Répartit `count` éléments en `k` parts aussi égales que possible. */
function distribute(count: number, k: number): number[] {
  const base = Math.floor(count / k);
  const rem = count % k;
  return Array.from({ length: k }, (_, g) => base + (g < rem ? 1 : 0));
}

/**
 * Répartit les participants en `numGroups` groupes d'affinité équilibrés.
 *
 * - Chaque groupe reçoit une part juste de chaque genre (tables mixtes, adapté
 *   à une soirée de rencontres).
 * - Affectation gloutonne : chacun rejoint le groupe (avec capacité restante
 *   pour son genre) où son affinité moyenne aux membres déjà présents est la
 *   plus forte.
 * - Amélioration locale : on échange deux personnes de même genre entre groupes
 *   tant que cela augmente l'affinité intra-groupe totale.
 *
 * Les groupes sont renvoyés triés par affinité moyenne décroissante et
 * numérotés de 1 à k (ce numéro sert de numéro de badge).
 */
export function computeGroups(
  participants: MatchParticipant[],
  strategy: MatchingStrategy,
  numGroups: number,
): GroupResult[] {
  const n = participants.length;
  if (n === 0) return [];
  const k = Math.max(1, Math.min(numGroups, n));
  const weights = strategy.weights ?? DEFAULT_STRATEGY.weights ?? {};

  // Matrice d'affinité (0..100) entre indices de participants.
  const aff: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      const s = pairScore(participants[i], participants[j], weights);
      aff[i][j] = s;
      aff[j][i] = s;
    }
  }

  // Indices regroupés par genre + capacité par groupe pour chaque genre.
  const byGender = new Map<string, number[]>();
  participants.forEach((p, i) => {
    const key = p.gender ?? "autre";
    if (!byGender.has(key)) byGender.set(key, []);
    byGender.get(key)!.push(i);
  });
  const genderCap: Record<string, number[]> = {};
  for (const [g, idxs] of Array.from(byGender.entries())) {
    genderCap[g] = distribute(idxs.length, k);
  }

  const groups: number[][] = Array.from({ length: k }, () => []);
  const placedByGender: Record<string, number>[] = groups.map(() => ({}));

  // Traite les genres du plus nombreux au moins nombreux, pour que les suivants
  // se placent près de membres compatibles déjà installés.
  const genderOrder = Array.from(byGender.keys()).sort(
    (a, b) => byGender.get(b)!.length - byGender.get(a)!.length,
  );

  for (const g of genderOrder) {
    for (const idx of byGender.get(g)!) {
      let best = -1;
      let bestScore = -Infinity;
      for (let gi = 0; gi < k; gi++) {
        if ((placedByGender[gi][g] ?? 0) >= genderCap[g][gi]) continue;
        const members = groups[gi];
        const avg =
          members.length === 0
            ? 0
            : members.reduce((s, m) => s + aff[idx][m], 0) / members.length;
        const adj = avg - members.length * 0.001; // départage : plus petit groupe
        if (adj > bestScore) {
          bestScore = adj;
          best = gi;
        }
      }
      if (best === -1) {
        best = groups.reduce(
          (min, m, gi) => (m.length < groups[min].length ? gi : min),
          0,
        );
      }
      groups[best].push(idx);
      placedByGender[best][g] = (placedByGender[best][g] ?? 0) + 1;
    }
  }

  // Amélioration locale par échanges de même genre (garde l'équilibre).
  const memberAff = (gi: number, idx: number): number =>
    groups[gi].reduce((s, m) => (m === idx ? s : s + aff[idx][m]), 0);
  let improved = true;
  let passes = 0;
  while (improved && passes < 8) {
    improved = false;
    passes++;
    for (let g1 = 0; g1 < k; g1++) {
      for (let g2 = g1 + 1; g2 < k; g2++) {
        for (const x of [...groups[g1]]) {
          for (const y of [...groups[g2]]) {
            if ((participants[x].gender ?? "autre") !== (participants[y].gender ?? "autre")) {
              continue;
            }
            if (!groups[g1].includes(x) || !groups[g2].includes(y)) continue;
            const before = memberAff(g1, x) + memberAff(g2, y);
            const afterX = groups[g2].reduce((s, m) => (m === y ? s : s + aff[x][m]), 0);
            const afterY = groups[g1].reduce((s, m) => (m === x ? s : s + aff[y][m]), 0);
            if (afterX + afterY > before + 1e-9) {
              groups[g1][groups[g1].indexOf(x)] = y;
              groups[g2][groups[g2].indexOf(y)] = x;
              improved = true;
            }
          }
        }
      }
    }
  }

  const results: GroupResult[] = groups.map((members) => {
    const pairs: PairResult[] = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = i + 1; j < members.length; j++) {
        pairs.push({
          a: participants[members[i]].id,
          b: participants[members[j]].id,
          score: aff[members[i]][members[j]],
        });
      }
    }
    const avgScore =
      pairs.length === 0
        ? 0
        : Math.round((pairs.reduce((s, p) => s + p.score, 0) / pairs.length) * 10) / 10;
    return { index: 0, memberIds: members.map((m) => participants[m].id), pairs, avgScore };
  });

  results.sort((a, b) => b.avgScore - a.avgScore);
  results.forEach((r, i) => (r.index = i + 1));
  return results;
}

/**
 * Calcule toutes les paires valides (filtres durs passés) avec leur score,
 * triées par score décroissant.
 */
export function computeMatches(
  participants: MatchParticipant[],
  strategy: MatchingStrategy,
): PairResult[] {
  const weights = strategy.weights ?? DEFAULT_STRATEGY.weights ?? {};
  const pairs: PairResult[] = [];
  for (let i = 0; i < participants.length; i++) {
    for (let j = i + 1; j < participants.length; j++) {
      const a = participants[i];
      const b = participants[j];
      if (!passesHardFilters(a, b)) continue;
      pairs.push({ a: a.id, b: b.id, score: pairScore(a, b, weights) });
    }
  }
  pairs.sort((x, y) => y.score - x.score);
  return pairs;
}
