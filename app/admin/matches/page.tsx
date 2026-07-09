import { redirect } from "next/navigation";
import { and, asc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { events, registrations, matches } from "@/lib/db/schema";
import { isAuthenticated } from "@/lib/admin-auth";
import MatchesView, { type MatchGroup } from "@/components/MatchesView";

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
  let groups: MatchGroup[] = [];

  if (event) {
    eventTitle = event.title;

    const members = await db
      .select({
        id: registrations.id,
        name: registrations.firstName,
        email: registrations.email,
        gender: registrations.gender,
        badge: registrations.badgeNumber,
        groupNumber: registrations.groupNumber,
      })
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, event.id),
          eq(registrations.paid, true),
          isNotNull(registrations.groupNumber),
        ),
      )
      .orderBy(asc(registrations.groupNumber), asc(registrations.firstName));

    // Affinité par groupe : moyenne des paires intra-groupe.
    const idToGroup = new Map<string, number>();
    for (const m of members) {
      if (m.groupNumber != null) idToGroup.set(m.id, m.groupNumber);
    }

    const pairRows = await db
      .select({
        a: matches.registrationA,
        score: matches.score,
      })
      .from(matches)
      .where(eq(matches.eventId, event.id));

    const scoreSum = new Map<number, number>();
    const scoreCount = new Map<number, number>();
    for (const p of pairRows) {
      const g = idToGroup.get(p.a);
      if (g == null) continue;
      const s = p.score ? Number(p.score) : 0;
      scoreSum.set(g, (scoreSum.get(g) ?? 0) + s);
      scoreCount.set(g, (scoreCount.get(g) ?? 0) + 1);
    }

    const byGroup = new Map<number, MatchGroup>();
    for (const m of members) {
      const num = m.groupNumber as number;
      if (!byGroup.has(num)) {
        const cnt = scoreCount.get(num) ?? 0;
        const avg = cnt > 0 ? Math.round((scoreSum.get(num)! / cnt) * 10) / 10 : 0;
        byGroup.set(num, { number: num, avgScore: avg, members: [] });
      }
      byGroup.get(num)!.members.push({
        name: m.name,
        email: m.email,
        gender: m.gender,
        badge: m.badge,
      });
    }

    groups = Array.from(byGroup.values()).sort((a, b) => a.number - b.number);
  }

  return <MatchesView eventTitle={eventTitle} groups={groups} />;
}
