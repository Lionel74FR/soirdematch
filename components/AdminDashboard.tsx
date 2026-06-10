"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export interface DashboardEvent {
  id: string;
  title: string;
  eventDate: string;
  capacity: number | null;
  genderQuota: number | null;
  priceCents: number | null;
}

export interface DashboardRegistration {
  id: string;
  firstName: string;
  email: string;
  gender: string | null;
  birthYear: number | null;
  status: string;
  paid: boolean;
  badgeNumber: number | null;
  createdAt: string;
}

interface Props {
  event: DashboardEvent | null;
  registrations: DashboardRegistration[];
  matchCount: number;
}

const currentYear = new Date().getFullYear();

function ageOf(birthYear: number | null): string {
  return birthYear ? `${currentYear - birthYear} ans` : "—";
}

function statusLabel(r: DashboardRegistration): string {
  if (r.status === "waitlist") return "Liste d'attente";
  if (r.paid || r.status === "paid") return "Payé";
  return "En attente";
}

export default function AdminDashboard({
  event,
  registrations,
  matchCount,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<null | "matching" | "badges">(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stats = useMemo(() => {
    const active = registrations.filter(
      (r) => r.status === "pending" || r.status === "paid",
    );
    const waitlist = registrations.filter((r) => r.status === "waitlist");
    const homme = active.filter((r) => r.gender === "homme").length;
    const femme = active.filter((r) => r.gender === "femme").length;
    const autre = active.filter(
      (r) => r.gender !== "homme" && r.gender !== "femme",
    ).length;
    const paid = active.filter((r) => r.paid || r.status === "paid").length;
    const pending = active.length - paid;
    const capacity = event?.capacity ?? 0;
    const fillRate = capacity ? Math.round((active.length / capacity) * 100) : 0;
    return {
      active,
      waitlist,
      homme,
      femme,
      autre,
      paid,
      pending,
      capacity,
      fillRate,
    };
  }, [registrations, event]);

  async function runAction(kind: "matching" | "badges") {
    if (kind === "matching") {
      const ok = window.confirm(
        "Lancer le matching ? Les paires existantes seront recalculées et remplacées.",
      );
      if (!ok) return;
    }
    setBusy(kind);
    setNotice(null);
    setError(null);
    try {
      const res = await fetch(`/api/admin/${kind}`, { method: "POST" });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        setError((data.error as string) || "Action impossible.");
        return;
      }
      if (kind === "matching") {
        setNotice(
          `Matching terminé : ${data.pairs} paires pour ${data.participants} participants (top ${data.topScore}/100, moyenne ${data.avgScore}/100).`,
        );
      } else {
        setNotice(`${data.count} badges attribués.`);
      }
      router.refresh();
    } catch {
      setError("Action impossible.");
    } finally {
      setBusy(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" }).catch(() => {});
    router.push("/admin/login");
    router.refresh();
  }

  const quota = event?.genderQuota ?? 0;
  const parityTotal = Math.max(stats.homme + stats.femme, 1);
  const hommePct = Math.round((stats.homme / parityTotal) * 100);
  const femmePct = 100 - hommePct;

  return (
    <main className="wrap">
      <header className="top">
        <div>
          <p className="mono kicker">SOIR DE MATCH — ADMIN</p>
          <h1>Tableau de bord</h1>
        </div>
        <button className="ghost" onClick={logout}>
          Déconnexion
        </button>
      </header>

      {!event ? (
        <div className="card empty">
          Aucune soirée ouverte à l'inscription pour le moment.
        </div>
      ) : (
        <>
          <div className="card eventcard">
            <div>
              <h2>{event.title}</h2>
              <p className="muted">
                {new Date(event.eventDate).toLocaleString("fr-FR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="fill">
              <div className="fillnum">{stats.fillRate}%</div>
              <div className="filllabel">
                {stats.active.length} / {stats.capacity} places
              </div>
            </div>
          </div>

          {(notice || error) && (
            <div className={`banner ${error ? "bad" : "good"}`}>
              {error || notice}
            </div>
          )}

          {/* Parité H / F */}
          <div className="card">
            <div className="cardhead">
              <h3>Parité hommes / femmes</h3>
              <span className="muted">Quota : {quota} par genre</span>
            </div>
            <div className="paritybar">
              <div
                className="phomme"
                style={{ width: `${hommePct}%` }}
                title={`Hommes : ${stats.homme}`}
              />
              <div
                className="pfemme"
                style={{ width: `${femmePct}%` }}
                title={`Femmes : ${stats.femme}`}
              />
            </div>
            <div className="paritylegend">
              <span>
                <i className="dot dh" /> {stats.homme} hommes
                {quota ? ` / ${quota}` : ""}
              </span>
              <span>
                <i className="dot df" /> {stats.femme} femmes
                {quota ? ` / ${quota}` : ""}
              </span>
              {stats.autre > 0 && (
                <span>
                  <i className="dot da" /> {stats.autre} autre(s)
                </span>
              )}
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid">
            <Stat label="Inscrits actifs" value={stats.active.length} />
            <Stat label="Payés" value={stats.paid} accent="gold" />
            <Stat label="En attente de paiement" value={stats.pending} />
            <Stat
              label="Liste d'attente"
              value={stats.waitlist.length}
              accent="rose"
            />
            <Stat label="Paires calculées" value={matchCount} accent="coral" />
          </div>

          {/* Actions */}
          <div className="card actions">
            <div>
              <h3>Actions</h3>
              <p className="muted">
                Le matching est déclenché manuellement uniquement.
              </p>
            </div>
            <div className="btns">
              <button
                className="primary"
                disabled={busy !== null}
                onClick={() => runAction("matching")}
              >
                {busy === "matching" ? "Calcul en cours…" : "Lancer le matching"}
              </button>
              <button
                className="secondary"
                disabled={busy !== null}
                onClick={() => runAction("badges")}
              >
                {busy === "badges" ? "Attribution…" : "Attribuer les badges"}
              </button>
            </div>
          </div>

          {/* Liste des inscrits */}
          <div className="card">
            <div className="cardhead">
              <h3>Inscrits</h3>
              <span className="muted">{registrations.length} au total</span>
            </div>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th>Badge</th>
                    <th>Prénom</th>
                    <th>Genre</th>
                    <th>Âge</th>
                    <th>Statut</th>
                    <th>Inscription</th>
                  </tr>
                </thead>
                <tbody>
                  {registrations.length === 0 && (
                    <tr>
                      <td colSpan={6} className="muted center">
                        Aucun inscrit pour l'instant.
                      </td>
                    </tr>
                  )}
                  {registrations.map((r) => (
                    <tr key={r.id}>
                      <td>{r.badgeNumber ?? "—"}</td>
                      <td>{r.firstName}</td>
                      <td className="cap">{r.gender ?? "—"}</td>
                      <td>{ageOf(r.birthYear)}</td>
                      <td>
                        <span className={`pill ${pillClass(r)}`}>
                          {statusLabel(r)}
                        </span>
                      </td>
                      <td className="muted">
                        {new Date(r.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <style jsx global>{`
        .wrap {
          max-width: 980px;
          margin: 0 auto;
          padding: 32px 20px 80px;
        }
        .top {
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          margin-bottom: 26px;
        }
        .kicker {
          color: var(--coral);
          font-size: 0.7rem;
          margin-bottom: 8px;
        }
        .top h1 {
          font-size: 1.9rem;
          color: var(--cream);
        }
        .card {
          background: var(--navy2);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
          padding: 22px;
          margin-bottom: 18px;
        }
        .empty {
          color: var(--mute);
          text-align: center;
        }
        .eventcard {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }
        .eventcard h2 {
          font-size: 1.3rem;
          color: var(--cream);
          margin-bottom: 4px;
        }
        .muted {
          color: var(--mute);
          font-size: 0.9rem;
        }
        .fill {
          text-align: right;
        }
        .fillnum {
          font-size: 2rem;
          font-weight: 800;
          color: var(--coral);
          line-height: 1;
        }
        .filllabel {
          color: var(--mute);
          font-size: 0.82rem;
          margin-top: 4px;
        }
        .banner {
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 18px;
          font-size: 0.92rem;
        }
        .banner.good {
          background: rgba(255, 201, 60, 0.12);
          border: 1px solid rgba(255, 201, 60, 0.4);
          color: var(--gold);
        }
        .banner.bad {
          background: rgba(205, 105, 115, 0.14);
          border: 1px solid rgba(205, 105, 115, 0.45);
          color: var(--rose);
        }
        .cardhead {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .cardhead h3,
        .actions h3 {
          font-size: 1.05rem;
          color: var(--cream);
        }
        .paritybar {
          display: flex;
          height: 26px;
          border-radius: 999px;
          overflow: hidden;
          background: rgba(0, 0, 0, 0.25);
        }
        .phomme {
          background: linear-gradient(90deg, #5b8cff, #3f6ad8);
          transition: width 0.4s ease;
        }
        .pfemme {
          background: linear-gradient(90deg, var(--rose), var(--coral));
          transition: width 0.4s ease;
        }
        .paritylegend {
          display: flex;
          gap: 20px;
          flex-wrap: wrap;
          margin-top: 12px;
          font-size: 0.9rem;
          color: var(--grey);
        }
        .dot {
          display: inline-block;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          margin-right: 6px;
        }
        .dh {
          background: #3f6ad8;
        }
        .df {
          background: var(--coral);
        }
        .da {
          background: var(--mute);
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }
        .stat {
          background: var(--navy2);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 14px;
          padding: 18px;
        }
        .stat .v {
          font-size: 1.9rem;
          font-weight: 800;
          color: var(--cream);
          line-height: 1;
        }
        .stat.gold .v {
          color: var(--gold);
        }
        .stat.rose .v {
          color: var(--rose);
        }
        .stat.coral .v {
          color: var(--coral);
        }
        .stat .l {
          color: var(--mute);
          font-size: 0.82rem;
          margin-top: 8px;
        }
        .actions {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          flex-wrap: wrap;
        }
        .btns {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }
        button {
          font-family: inherit;
        }
        .primary,
        .secondary,
        .ghost {
          border-radius: 999px;
          padding: 12px 22px;
          font-weight: 700;
          font-size: 0.92rem;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
          border: 1px solid transparent;
        }
        .primary {
          background: var(--coral);
          color: var(--navy);
          border: none;
        }
        .secondary {
          background: transparent;
          color: var(--cream);
          border: 1px solid rgba(255, 255, 255, 0.25);
        }
        .ghost {
          background: transparent;
          color: var(--mute);
          border: 1px solid rgba(255, 255, 255, 0.15);
        }
        .primary:disabled,
        .secondary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .primary:not(:disabled):active,
        .secondary:not(:disabled):active {
          transform: scale(0.98);
        }
        .tablewrap {
          overflow-x: auto;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.9rem;
        }
        th {
          text-align: left;
          color: var(--mute);
          font-weight: 600;
          font-size: 0.78rem;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 0 10px 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        td {
          padding: 12px 10px;
          color: var(--cream);
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        td.cap {
          text-transform: capitalize;
        }
        td.center {
          text-align: center;
        }
        .pill {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 999px;
          font-size: 0.78rem;
          font-weight: 600;
        }
        .pill.p-paid {
          background: rgba(255, 201, 60, 0.16);
          color: var(--gold);
        }
        .pill.p-pending {
          background: rgba(150, 155, 180, 0.16);
          color: var(--grey);
        }
        .pill.p-wait {
          background: rgba(205, 105, 115, 0.16);
          color: var(--rose);
        }
        @media (max-width: 560px) {
          .eventcard,
          .actions {
            flex-direction: column;
            align-items: flex-start;
          }
          .fill {
            text-align: left;
          }
        }
      `}</style>
    </main>
  );
}

function pillClass(r: DashboardRegistration): string {
  if (r.status === "waitlist") return "p-wait";
  if (r.paid || r.status === "paid") return "p-paid";
  return "p-pending";
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent?: "gold" | "rose" | "coral";
}) {
  return (
    <div className={`stat ${accent ?? ""}`}>
      <div className="v">{value}</div>
      <div className="l">{label}</div>
    </div>
  );
}
