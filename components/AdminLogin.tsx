"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.push("/admin");
        router.refresh();
        return;
      }
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setError(data.error || "Connexion impossible.");
    } catch {
      setError("Connexion impossible.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="wrap">
      <form className="card" onSubmit={submit}>
        <p className="mono kicker">SOIR DE MATCH</p>
        <h1>Espace organisateur</h1>
        <p className="sub">Accès réservé. Entre le mot de passe administrateur.</p>

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          autoFocus
          autoComplete="current-password"
        />
        {error && <p className="err">{error}</p>}
        <button type="submit" disabled={loading || !password}>
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>

      <style jsx global>{`
        .wrap {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          background:
            radial-gradient(
              900px 500px at 80% -10%,
              rgba(240, 123, 92, 0.16),
              transparent
            ),
            var(--navy);
        }
        .card {
          width: 100%;
          max-width: 400px;
          background: var(--navy2);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 20px;
          padding: 36px 32px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.45);
        }
        .kicker {
          color: var(--coral);
          font-size: 0.72rem;
          margin-bottom: 18px;
        }
        .card h1 {
          font-size: 1.7rem;
          color: var(--cream);
          margin-bottom: 8px;
        }
        .sub {
          color: var(--mute);
          font-size: 0.95rem;
          margin-bottom: 22px;
        }
        .card input {
          width: 100%;
          padding: 14px 16px;
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.12);
          background: rgba(0, 0, 0, 0.2);
          color: var(--cream);
          font-size: 1rem;
          outline: none;
        }
        .card input:focus {
          border-color: var(--coral);
        }
        .err {
          color: var(--rose);
          font-size: 0.9rem;
          margin-top: 12px;
        }
        .card button {
          width: 100%;
          margin-top: 18px;
          padding: 14px 16px;
          border: none;
          border-radius: 999px;
          background: var(--coral);
          color: var(--navy);
          font-weight: 700;
          font-size: 1rem;
          cursor: pointer;
          transition: opacity 0.2s, transform 0.1s;
        }
        .card button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .card button:not(:disabled):active {
          transform: scale(0.98);
        }
      `}</style>
    </main>
  );
}
