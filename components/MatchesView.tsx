"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export interface MatchPerson {
  name: string;
  email: string;
  gender: string | null;
  badge: number | null;
}

export interface MatchPair {
  id: string;
  score: number;
  a: MatchPerson;
  b: MatchPerson;
}

interface Props {
  eventTitle: string | null;
  pairs: MatchPair[];
}

function scoreClass(score: number): string {
  if (score >= 70) return "high";
  if (score >= 50) return "mid";
  return "low";
}

function personLabel(p: MatchPerson): string {
  const badge = p.badge != null ? `#${p.badge} ` : "";
  return `${badge}${p.name}`;
}

export default function MatchesView({ eventTitle, pairs }: Props) {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    if (pairs.length === 0) return { count: 0, top: 0, avg: 0 };
    const scores = pairs.map((p) => p.score);
    return {
      count: pairs.length,
      top: Math.max(...scores),
      avg: Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) / 10,
    };
  }, [pairs]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pairs;
    return pairs.filter((p) => {
      const hay = `${p.a.name} ${p.a.email} ${p.b.name} ${p.b.email}`.toLowerCase();
      return hay.includes(q);
    });
  }, [pairs, query]);

  function exportCsv() {
    const header = [
      "rang",
      "score",
      "personne_a",
      "email_a",
      "badge_a",
      "personne_b",
      "email_b",
      "badge_b",
    ];
    const lines = pairs.map((p, i) =>
      [
        i + 1,
        p.score,
        p.a.name,
        p.a.email,
        p.a.badge ?? "",
        p.b.name,
        p.b.email,
        p.b.badge ?? "",
      ]
        .map((v) => {
          const s = String(v);
          return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
        })
        .join(","),
    );
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "soir-de-match-paires.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="wrap">
      <header className="top">
        <div>
          <p className="mono kicker">SOIR DE MATCH — ADMIN</p>
          <h1>Résultats du matching</h1>
          {eventTitle && <p className="muted sub">{eventTitle}</p>}
        </div>
        <button className="ghost" onClick={() => router.push("/admin")}>
          ← Tableau de bord
        </button>
      </header>

      {!eventTitle ? (
        <div className="card empty">Aucune soirée ouverte pour le moment.</div>
      ) : pairs.length === 0 ? (
        <div className="card empty">
          Aucune paire calculée pour l&apos;instant. Lance le matching depuis le
          tableau de bord.
        </div>
      ) : (
        <>
          <div className="grid">
            <div className="stat">
              <div className="statnum coral">{stats.count}</div>
              <div className="statlabel">Paires</div>
            </div>
            <div className="stat">
              <div className="statnum gold">{stats.top}</div>
              <div className="statlabel">Meilleur score</div>
            </div>
            <div className="stat">
              <div className="statnum">{stats.avg}</div>
              <div className="statlabel">Score moyen</div>
            </div>
          </div>

          <div className="card">
            <div className="cardhead">
              <h3>Paires ({filtered.length})</h3>
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
            </div>

            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th className="rank">#</th>
                    <th>Personne A</th>
                    <th>Personne B</th>
                    <th className="scorecol">Affinité</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p, i) => (
                    <tr key={p.id}>
                      <td className="rank">{i + 1}</td>
                      <td>
                        <div className="pname">{personLabel(p.a)}</div>
                        <div className="pmail">{p.a.email}</div>
                      </td>
                      <td>
                        <div className="pname">{personLabel(p.b)}</div>
                        <div className="pmail">{p.b.email}</div>
                      </td>
                      <td className="scorecol">
                        <span className={`score ${scoreClass(p.score)}`}>
                          {p.score}
                          <span className="over">/100</span>
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
        .cardhead {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .cardhead h3 {
          color: var(--cream);
          font-size: 1.05rem;
        }
        .tools {
          display: flex;
          gap: 10px;
          align-items: center;
          flex-wrap: wrap;
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
          font-size: 0.72rem;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 0 12px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }
        td {
          padding: 14px 12px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          color: var(--grey);
          vertical-align: middle;
        }
        .rank {
          width: 44px;
          color: var(--mute);
          text-align: center;
        }
        .pname {
          color: var(--cream);
          font-weight: 600;
        }
        .pmail {
          color: var(--mute);
          font-size: 0.8rem;
          margin-top: 2px;
        }
        .scorecol {
          text-align: right;
          white-space: nowrap;
        }
        .score {
          font-weight: 700;
          font-size: 1rem;
          padding: 5px 11px;
          border-radius: 999px;
          display: inline-block;
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
        @media (max-width: 640px) {
          .grid {
            grid-template-columns: 1fr;
          }
          .search {
            min-width: 0;
            flex: 1;
          }
        }
      `}</style>
    </main>
  );
}
