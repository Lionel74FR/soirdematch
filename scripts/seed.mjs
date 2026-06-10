import { neon } from "@neondatabase/serverless";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}

const sql = neon(url);

const VENUE_SLUG = "le-chardon-decosse";
const EVENT_DATE = "2026-07-09T19:30:00";

const matchingStrategy = {
  hardFilters: ["seeking", "ageRange", "birthYear", "smokingDealbreaker"],
  weights: {
    relationType: 20,
    values: 14,
    interests: 12,
    socialEnergy: 10,
  },
};

async function main() {
  let [venue] = await sql`SELECT id FROM venues WHERE slug = ${VENUE_SLUG}`;
  if (!venue) {
    [venue] = await sql`
      INSERT INTO venues (name, slug, city, address)
      VALUES (${"Le Chardon d'Écosse"}, ${VENUE_SLUG}, ${"Annecy"}, ${"Annecy"})
      RETURNING id`;
    console.log("Venue créé:", venue.id);
  } else {
    console.log("Venue existant:", venue.id);
  }

  const [openEvent] = await sql`
    SELECT id FROM events WHERE status = ${"open"} ORDER BY event_date ASC LIMIT 1`;
  if (openEvent) {
    console.log("Événement ouvert déjà présent:", openEvent.id);
    return;
  }

  const [event] = await sql`
    INSERT INTO events
      (venue_id, title, event_date, capacity, price_cents, gender_quota, matching_strategy, status)
    VALUES
      (${venue.id}, ${"Jeudi 9 juillet 2026 — Annecy"}, ${EVENT_DATE}, ${50}, ${2500}, ${25}, ${JSON.stringify(matchingStrategy)}, ${"open"})
    RETURNING id`;
  console.log("Événement créé:", event.id);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
