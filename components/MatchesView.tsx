"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export interface MatchPerson {
  name: string;
  email: string;
  gender: string | null;
  badge: number | null;
}

export interface MatchGroup {
  number: number;
  avgScore: number;
  members: MatchPerson[];
}

interface Props {
  eventTitle: string | null;
  groups: MatchGroup[];
}

function scoreClass(score: number): string {
  if (score >= 70) return "high";
  if (score >= 50) return "mid";
  return "low";
}

function genderLabel(g: string | null): string {
  if (g === "homme") return "H";
  if (g === "femme") return "F";
  return "?";
}

export default function MatchesView({ eventTitle, groups }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const people = groups.reduce((s, g) => s + g.members.length, 0);
    const scores = groups.map((g) => g.avgScore);
    return {
      groups: groups.length,
      people,
      avg:
        scores.length > 0
          ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) /
            10
          : 0,
    };
  }, [groups]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((g) => ({
        ...g,
        members: g.members.filter((m) =>
          `${m.name} ${m.email}`.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.members.length > 0);
  }, [groups, query]);

  function exportCsv() {
    const header = ["groupe", "affinite_groupe", "prenom", "email", "genre", "badge"];
    const lines: string[] = [];
    for (const g of groups) {
      for (const m of g.members) {
        lines.push(
          [g.number, g.avgScore, m.name, m.email, m.gender ?? "", m.badge ?? ""]
            .map((v) => {
              const s = String(v);
              return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
            })
            .join(","),
        );
      }
    }
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "soir-de-match-groupes.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="wrap">
      <header className="top">
        <div>
          <p className="mono kicker">SOIR DE MATCH — ADMIN</p>
          <h1>Groupes de match</h1>
          {eventTitle && <p className="muted sub">{eventTitle}</p>}
        </div>
        <button className="ghost" onClick={() => router.push("/admin")}>
          ← Tableau de bord
        </button>
      </header>

      {!eventTitle ? (
        <div className="card empty">Aucune soirée ouverte pour le moment.</div>
      ) : groups.length === 0 ? (
        <div className="card empty">
          Aucun groupe formé pour l&apos;instant. Lance le matching depuis le
          tableau de bord.
        </div>
      ) : (
        <>
          <div className="grid">
            <div className="stat">
              <div className="statnum coral">{stats.groups}</div>
              <div className="statlabel">Groupes</div>
            </div>
            <div className="stat">
              <div className="statnum gold">{stats.people}</div>
              <div className="statlabel">Participants</div>
            </div>
            <div className="stat">
              <div className="statnum">{stats.avg}</div>
              <div className="statlabel">Affinité moyenne</div>
            </div>
          </div>

          <div className="tools">
            <input
              className="search"
              type="search"
              placeholder="Rechercher un prénom ou email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="secondary" onClick={exportCsv}>
              Exporter CSV
            </button>
          </div>

          <div className="groups">
            {filtered.map((g) => (
              <div className="card group" key={g.number}>
                <div className="grouphead">
                  <div className="gtitle">
                    <span className="gbadge">Groupe {g.number}</span>
                    <span className="gcount">
                      {g.members.length} personne
                      {g.members.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <span className={`score ${scoreClass(g.avgScore)}`}>
                    {g.avgScore}
                    <span className="over">/100</span>
                  </span>
                </div>
                <ul className="members">
                  {g.members.map((m) => (
                    <li key={m.email}>
                      <span className={`gtag ${m.gender ?? "autre"}`}>
                        {genderLabel(m.gender)}
                      </span>
                      <span className="pname">{m.name}</span>
                      <span className="pmail">{m.email}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </>
      )}

      <style jsx>{`
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
          gap: 16px;
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
        .sub {
          margin-top: 6px;
        }
        .muted {
          color: var(--mute);
          font-size: 0.9rem;
        }
        .ghost {
          background: transparent;
          color: var(--grey);
          border: 1px solid rgba(255, 255, 255, 0.14);
          border-radius: 999px;
          padding: 9px 16px;
          font-size: 0.85rem;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          transition: border-color 0.2s;
        }
        .ghost:hover {
          border-color: rgba(255, 255, 255, 0.3);
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
        .grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }
        .stat {
          background: var(--navy2);
          border: 1px solid rgba(255, 255, 255, 0.07);
          border-radius: 16px;
          padding: 20px 22px;
        }
        .statnum {
          font-size: 1.9rem;
          font-weight: 700;
          color: var(--cream);
          font-family: var(--font-montserrat), sans-serif;
        }
        .statnum.coral {
          color: var(--coral);
        }
        .statnum.gold {
          color: var(--gold);
        }
        .statlabel {
          color: var(--mute);
          font-size: 0.85rem;
          margin-top: 4px;
        }
        .tools {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
          margin-bottom: 18px;
        }
        .search {
          background: rgba(0, 0, 0, 0.25);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 999px;
          padding: 8px 14px;
          color: var(--cream);
          font-size: 0.85rem;
          font-family: inherit;
          min-width: 220px;
          flex: 1;
        }
        .search::placeholder {
          color: var(--mute);
        }
        .secondary {
          background: var(--coral);
          color: var(--navy);
          border: none;
          border-radius: 999px;
          padding: 9px 18px;
          font-size: 0.85rem;
          font-weight: 700;
          font-family: inherit;
          cursor: pointer;
          white-space: nowrap;
          transition: opacity 0.2s;
        }
        .secondary:hover {
          opacity: 0.9;
        }
        .groups {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
        }
        .group {
          margin-bottom: 0;
        }
        .grouphead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          margin-bottom: 14px;
          padding-bottom: 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        .gtitle {
          display: flex;
          flex-direction: column;
          gap: 3px;
        }
        .gbadge {
          color: var(--cream);
          font-weight: 700;
          font-size: 1.05rem;
          font-family: var(--font-montserrat), sans-serif;
        }
        .gcount {
          color: var(--mute);
          font-size: 0.78rem;
        }
        .members {
          list-style: none;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .members li {
          display: grid;
          grid-template-columns: auto 1fr;
          grid-template-rows: auto auto;
          column-gap: 10px;
          align-items: center;
        }
        .gtag {
          grid-row: 1 / 3;
          width: 26px;
          height: 26px;
          border-radius: 999px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.72rem;
          font-weight: 700;
          background: rgba(150, 155, 180, 0.16);
          color: var(--grey);
        }
        .gtag.homme {
          background: rgba(240, 123, 92, 0.16);
          color: var(--coral);
        }
        .gtag.femme {
          background: rgba(205, 105, 115, 0.18);
          color: var(--rose);
        }
        .pname {
          color: var(--cream);
          font-weight: 600;
          font-size: 0.92rem;
        }
        .pmail {
          color: var(--mute);
          font-size: 0.78rem;
          grid-column: 2;
        }
        .score {
          font-weight: 700;
          font-size: 1rem;
          padding: 5px 11px;
          border-radius: 999px;
          display: inline-block;
          white-space: nowrap;
        }
        .score .over {
          font-size: 0.7rem;
          font-weight: 500;
          opacity: 0.7;
        }
        .score.high {
          background: rgba(255, 201, 60, 0.16);
          color: var(--gold);
        }
        .score.mid {
          background: rgba(240, 123, 92, 0.16);
          color: var(--coral);
        }
        .score.low {
          background: rgba(150, 155, 180, 0.16);
          color: var(--grey);
        }
        @media (max-width: 720px) {
          .groups {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .grid {
            grid-template-columns: 1fr;
          }
          .search {
            min-width: 0;
          }
        }
      `}</style>
    </main>
  );
}
