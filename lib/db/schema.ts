import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  jsonb,
  boolean,
  numeric,
} from "drizzle-orm/pg-core";

// L'établissement hôte (multi-tenant dès le départ).
// V1 : une seule ligne — Le Chardon d'Écosse à Annecy.
export const venues = pgTable("venues", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  city: text("city"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Les soirées. matching_strategy contient les pondérations d'affinité,
// modifiables sans redéploiement.
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  venueId: uuid("venue_id")
    .notNull()
    .references(() => venues.id),
  title: text("title").notNull(),
  eventDate: timestamp("event_date").notNull(),
  capacity: integer("capacity"),
  priceCents: integer("price_cents"),
  genderQuota: integer("gender_quota"),
  matchingStrategy: jsonb("matching_strategy"),
  status: text("status").default("open").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Inscriptions. delete_after = event_date + 30 jours (purge RGPD automatique).
export const registrations = pgTable("registrations", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id),
  firstName: text("first_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  gender: text("gender"),
  birthYear: integer("birth_year"),
  status: text("status").default("pending").notNull(),
  badgeNumber: integer("badge_number"),
  groupNumber: integer("group_number"),
  stripeSessionId: text("stripe_session_id"),
  paid: boolean("paid").default(false).notNull(),
  consentAt: timestamp("consent_at"),
  deleteAfter: timestamp("delete_after"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Les 12 réponses du questionnaire, stockées en jsonb.
export const questionnaireAnswers = pgTable("questionnaire_answers", {
  id: uuid("id").primaryKey().defaultRandom(),
  registrationId: uuid("registration_id")
    .notNull()
    .references(() => registrations.id),
  answers: jsonb("answers").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Appariements calculés entre deux inscriptions.
export const matches = pgTable("matches", {
  id: uuid("id").primaryKey().defaultRandom(),
  eventId: uuid("event_id")
    .notNull()
    .references(() => events.id),
  registrationA: uuid("registration_a")
    .notNull()
    .references(() => registrations.id),
  registrationB: uuid("registration_b")
    .notNull()
    .references(() => registrations.id),
  score: numeric("score"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Avis post-soirée, anonymes par défaut (minimisation RGPD : aucun lien
// avec l'identité du participant — ni email, ni registration_id, ni IP).
export const surveyResponses = pgTable("survey_responses", {
  id: uuid("id").primaryKey().defaultRandom(),
  submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  noteGlobale: integer("note_globale").notNull(),
  nps: integer("nps").notNull(),
  qualiteMatch: integer("qualite_match").notNull(),
  rencontre: text("rencontre").notNull(),
  noteFormat: integer("note_format").notNull(),
  commentaire: text("commentaire"),
  consentAvis: boolean("consent_avis").default(false).notNull(),
  consentMarketing: boolean("consent_marketing").default(false).notNull(),
});

// Journal d'audit pour la traçabilité RGPD.
export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  action: text("action").notNull(),
  entity: text("entity"),
  entityId: text("entity_id"),
  meta: jsonb("meta"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
