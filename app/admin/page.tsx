import { redirect } from "next/navigation";
import { and, asc, desc, eq, isNotNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { events, registrations } from "@/lib/db/schema";
import { isAuthenticated } from "@/lib/admin-auth";
import AdminDashboard, {
  type DashboardEvent,
  type DashboardRegistration,
} from "@/components/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tableau de bord — Soir de Match",
  robots: { index: false, follow: false },
};

export default async function AdminPage() {
  if (!isAuthenticated()) redirect("/admin/login");

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.status, "open"))
    .orderBy(asc(events.eventDate))
    .limit(1);

  let dashEvent: DashboardEvent | null = null;
  let regs: DashboardRegistration[] = [];
  let groupCount = 0;

  if (event) {
    dashEvent = {
      id: event.id,
      title: event.title,
      eventDate: event.eventDate.toISOString(),
      capacity: event.capacity,
      genderQuota: event.genderQuota,
      priceCents: event.priceCents,
    };

    const rows = await db
      .select({
        id: registrations.id,
        firstName: registrations.firstName,
        email: registrations.email,
        phone: registrations.phone,
        gender: registrations.gender,
        birthYear: registrations.birthYear,
        status: registrations.status,
        paid: registrations.paid,
        badgeNumber: registrations.badgeNumber,
        createdAt: registrations.createdAt,
      })
      .from(registrations)
      .where(eq(registrations.eventId, event.id))
      .orderBy(desc(registrations.createdAt));

    regs = rows.map((r) => ({
      id: r.id,
      firstName: r.firstName,
      email: r.email,
      phone: r.phone,
      gender: r.gender,
      birthYear: r.birthYear,
      status: r.status,
      paid: r.paid,
      badgeNumber: r.badgeNumber,
      createdAt: r.createdAt.toISOString(),
    }));

    const grouped = await db
      .selectDistinct({ groupNumber: registrations.groupNumber })
      .from(registrations)
      .where(
        and(
          eq(registrations.eventId, event.id),
          isNotNull(registrations.groupNumber),
        ),
      );
    groupCount = grouped.length;
  }

  return (
    <AdminDashboard
      event={dashEvent}
      registrations={regs}
      groupCount={groupCount}
    />
  );
}
