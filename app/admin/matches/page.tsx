import { redirect } from "next/navigation";
import { alias } from "drizzle-orm/pg-core";
import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { events, registrations, matches } from "@/lib/db/schema";
import { isAuthenticated } from "@/lib/admin-auth";
import MatchesView, { type MatchPair } from "@/components/MatchesView";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Résultats du matching — Soir de Match",
  robots: { index: false, follow: false },
};

export default async function MatchesPage() {
  if (!isAuthenticated()) redirect("/admin/login");

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.status, "open"))
    .orderBy(asc(events.eventDate))
    .limit(1);

  let eventTitle: string | null = null;
  let pairs: MatchPair[] = [];

  if (event) {
    eventTitle = event.title;

    const a = alias(registrations, "a");
    const b = alias(registrations, "b");

    const rows = await db
      .select({
        id: matches.id,
        score: matches.score,
        aName: a.firstName,
        aEmail: a.email,
        aGender: a.gender,
        aBadge: a.badgeNumber,
        bName: b.firstName,
        bEmail: b.email,
        bGender: b.gender,
        bBadge: b.badgeNumber,
      })
      .from(matches)
      .innerJoin(a, eq(a.id, matches.registrationA))
      .innerJoin(b, eq(b.id, matches.registrationB))
      .where(eq(matches.eventId, event.id))
      .orderBy(desc(matches.score));

    pairs = rows.map((r) => ({
      id: r.id,
      score: r.score ? Math.round(Number(r.score) * 10) / 10 : 0,
      a: {
        name: r.aName,
        email: r.aEmail,
        gender: r.aGender,
        badge: r.aBadge,
      },
      b: {
        name: r.bName,
        email: r.bEmail,
        gender: r.bGender,
        badge: r.bBadge,
      },
    }));
  }

  return <MatchesView eventTitle={eventTitle} pairs={pairs} />;
}
