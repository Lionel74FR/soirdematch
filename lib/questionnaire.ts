export type QuestionType =
  | "text"
  | "email"
  | "tel"
  | "year"
  | "single"
  | "multi";

export interface QuestionOption {
  value: string;
  label: string;
}

export interface Question {
  id: string;
  group: "filtre" | "affinite";
  type: QuestionType;
  title: string;
  help?: string;
  placeholder?: string;
  options?: QuestionOption[];
  /** For "multi": maximum number of selectable options. */
  maxSelect?: number;
  /** For "year": inclusive bounds. */
  minYear?: number;
  maxYear?: number;
}

const currentYear = new Date().getFullYear();

export const QUESTIONS: Question[] = [
  // ---- Filtres durs ----
  {
    id: "firstName",
    group: "filtre",
    type: "text",
    title: "Comment tu t'appelles ?",
    help: "Juste ton prénom, c'est lui qui s'affichera sur ton badge.",
    placeholder: "Ton prénom",
  },
  {
    id: "email",
    group: "filtre",
    type: "email",
    title: "Ton adresse email",
    help: "On t'y enverra ta confirmation et tes matchs. Jamais de spam.",
    placeholder: "prenom@email.com",
  },
  {
    id: "phone",
    group: "filtre",
    type: "tel",
    title: "Ton numéro de téléphone",
    help: "Uniquement pour te prévenir le jour J en cas d'imprévu.",
    placeholder: "06 12 34 56 78",
  },
  {
    id: "gender",
    group: "filtre",
    type: "single",
    title: "Tu es…",
    help: "La parité hommes-femmes est garantie par quotas.",
    options: [
      { value: "homme", label: "Un homme" },
      { value: "femme", label: "Une femme" },
      { value: "autre", label: "Autre / je préfère préciser sur place" },
    ],
  },
  {
    id: "birthYear",
    group: "filtre",
    type: "year",
    title: "Ton année de naissance",
    help: "La soirée est réservée aux personnes majeures.",
    minYear: 1950,
    maxYear: currentYear - 18,
  },
  {
    id: "seeking",
    group: "filtre",
    type: "single",
    title: "Tu cherches à rencontrer…",
    options: [
      { value: "hommes", label: "Des hommes" },
      { value: "femmes", label: "Des femmes" },
      { value: "les_deux", label: "Les deux" },
    ],
  },
  {
    id: "ageRange",
    group: "filtre",
    type: "single",
    title: "Quelle tranche d'âge t'intéresse ?",
    options: [
      { value: "18-25", label: "18 – 25 ans" },
      { value: "25-35", label: "25 – 35 ans" },
      { value: "35-45", label: "35 – 45 ans" },
      { value: "45-55", label: "45 – 55 ans" },
      { value: "55+", label: "55 ans et plus" },
    ],
  },
  {
    id: "smokingDealbreaker",
    group: "filtre",
    type: "single",
    title: "Le tabac, c'est rédhibitoire pour toi ?",
    options: [
      { value: "oui", label: "Oui, je préfère un non-fumeur" },
      { value: "non", label: "Non, ça ne me dérange pas" },
    ],
  },

  // ---- Affinités ----
  {
    id: "relationType",
    group: "affinite",
    type: "single",
    title: "Tu viens chercher quoi, surtout ?",
    help: "C'est le critère qui pèse le plus dans le calcul de tes matchs.",
    options: [
      { value: "serieuse", label: "Une relation sérieuse" },
      { value: "on_verra", label: "Une histoire, on verra où ça mène" },
      { value: "legere", label: "Des rencontres légères" },
      { value: "amitie", label: "De nouvelles amitiés d'abord" },
    ],
  },
  {
    id: "values",
    group: "affinite",
    type: "multi",
    title: "Ce qui compte le plus pour toi",
    help: "Choisis jusqu'à 3 valeurs.",
    maxSelect: 3,
    options: [
      { value: "famille", label: "Famille" },
      { value: "carriere", label: "Carrière & ambition" },
      { value: "ecologie", label: "Écologie" },
      { value: "spiritualite", label: "Spiritualité" },
      { value: "fete", label: "Fête & sorties" },
      { value: "bien_etre", label: "Sport & bien-être" },
      { value: "voyages", label: "Voyages & découverte" },
      { value: "culture", label: "Culture & arts" },
    ],
  },
  {
    id: "interests",
    group: "affinite",
    type: "multi",
    title: "Tes centres d'intérêt",
    help: "Choisis jusqu'à 5 thèmes.",
    maxSelect: 5,
    options: [
      { value: "musique", label: "Musique" },
      { value: "cinema", label: "Cinéma & séries" },
      { value: "sport", label: "Sport" },
      { value: "cuisine", label: "Cuisine & gastronomie" },
      { value: "jeux", label: "Jeux vidéo" },
      { value: "lecture", label: "Lecture" },
      { value: "art", label: "Art & expos" },
      { value: "nature", label: "Nature & rando" },
      { value: "tech", label: "Tech & innovation" },
      { value: "voyage", label: "Voyages" },
    ],
  },
  {
    id: "socialEnergy",
    group: "affinite",
    type: "single",
    title: "Ton énergie en soirée",
    options: [
      { value: "reserve", label: "Plutôt réservé(e), j'observe d'abord" },
      { value: "equilibre", label: "Entre les deux, ça dépend de l'ambiance" },
      { value: "extraverti", label: "Extraverti(e), je vais vers les gens" },
    ],
  },
];

export type Answers = Record<string, string | string[]>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+0-9][0-9 .\-]{7,}$/;

/** Validates a single answer. Returns an error message or null if valid. */
export function validateAnswer(q: Question, value: unknown): string | null {
  if (q.type === "multi") {
    if (!Array.isArray(value) || value.length === 0) {
      return "Choisis au moins une option.";
    }
    if (q.maxSelect && value.length > q.maxSelect) {
      return `Choisis au maximum ${q.maxSelect} options.`;
    }
    return null;
  }

  const v = typeof value === "string" ? value.trim() : "";
  if (!v) return "Cette réponse est obligatoire.";

  switch (q.type) {
    case "email":
      return EMAIL_RE.test(v) ? null : "Entre une adresse email valide.";
    case "tel":
      return PHONE_RE.test(v) ? null : "Entre un numéro de téléphone valide.";
    case "year": {
      const year = Number(v);
      if (!Number.isInteger(year)) return "Entre une année valide.";
      if (q.minYear && year < q.minYear) return "Année invalide.";
      if (q.maxYear && year > q.maxYear) {
        return "Tu dois être majeur(e) pour participer.";
      }
      return null;
    }
    case "single":
      return q.options?.some((o) => o.value === v)
        ? null
        : "Choisis une option.";
    default:
      return null;
  }
}

/** Validates the full set of answers server-side. Returns list of error strings. */
export function validateAll(answers: Answers): string[] {
  const errors: string[] = [];
  for (const q of QUESTIONS) {
    const err = validateAnswer(q, answers[q.id]);
    if (err) errors.push(`${q.id}: ${err}`);
  }
  return errors;
}
