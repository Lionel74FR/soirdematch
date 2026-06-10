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
