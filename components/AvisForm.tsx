"use client";

import { useState } from "react";

/* Formulaire d'avis post-soirée — PUBLIC et ANONYME (minimisation RGPD).
   Mobile-first, charte Soir de Match : navy #171b2b, corail #f07b5c,
   Montserrat (titres) / Poppins (texte) via les variables globales. */

type RencontreValue = "oui" | "peut_etre" | "non";

const RENCONTRE_OPTIONS: { value: RencontreValue; label: string }[] = [
  { value: "oui", label: "Oui 💘" },
  { value: "peut_etre", label: "Peut-être" },
  { value: "non", label: "Non, pas cette fois" },
];

function StarRating({
  value,
  onChange,
  label,
}: {
  value: number | null;
  onChange: (v: number) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex items-center gap-2"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className="text-3xl leading-none transition-transform active:scale-90"
          style={{
            color:
              value !== null && n <= value
                ? "var(--gold)"
                : "rgba(150,155,180,0.35)",
            filter:
              value !== null && n <= value
                ? "drop-shadow(0 0 6px rgba(255,201,60,0.35))"
                : "none",
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

function QuestionCard({
  num,
  title,
  children,
}: {
  num: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl p-5"
      style={{ background: "var(--navy2)" }}
    >
      <p
        className="mb-3 text-[15px] font-semibold"
        style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
      >
        <span style={{ color: "var(--coral)" }}>{num}.</span> {title}
      </p>
      {children}
    </div>
  );
}

export default function AvisForm() {
  const [noteGlobale, setNoteGlobale] = useState<number | null>(null);
  const [nps, setNps] = useState<number | null>(null);
  const [qualiteMatch, setQualiteMatch] = useState<number | null>(null);
  const [rencontre, setRencontre] = useState<RencontreValue | null>(null);
  const [noteFormat, setNoteFormat] = useState<number | null>(null);
  const [commentaire, setCommentaire] = useState("");
  const [consentAvis, setConsentAvis] = useState(false);
  const [consentMarketing, setConsentMarketing] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const complete =
    noteGlobale !== null &&
    nps !== null &&
    qualiteMatch !== null &&
    rencontre !== null &&
    noteFormat !== null;

  async function submit() {
    if (!complete || submitting) {
      if (!complete)
        setError("Merci de répondre à toutes les questions notées 🙏");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      const res = await fetch("/api/avis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          noteGlobale,
          nps,
          qualiteMatch,
          rencontre,
          noteFormat,
          commentaire: commentaire.trim() || undefined,
          consentAvis,
          consentMarketing,
        }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error || "Une erreur est survenue. Réessaie.");
      }
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <main className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center px-6 py-16 text-center">
        <div className="text-6xl">💘</div>
        <h1
          className="mt-6 text-2xl font-extrabold"
          style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
        >
          Merci pour ton avis&nbsp;!
        </h1>
        <p className="mt-4 leading-relaxed" style={{ color: "var(--grey)" }}>
          Tes réponses sont bien enregistrées, de façon anonyme. Elles nous
          aident à rendre les prochaines soirées encore meilleures.
        </p>
        <a
          href="https://www.instagram.com/soirdematch/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-8 inline-block rounded-full px-8 py-4 text-sm font-bold"
          style={{ background: "var(--coral)", color: "var(--navy)" }}
        >
          Suivre @soirdematch sur Instagram
        </a>
        <p className="mt-6 text-xs" style={{ color: "var(--mute)" }}>
          À très vite pour un prochain Soir de Match ✨
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-md px-4 pb-16 pt-10 sm:max-w-lg">
      <header className="mb-8 text-center">
        <p
          className="mono text-[11px] font-semibold uppercase"
          style={{ color: "var(--coral)" }}
        >
          Soir de Match
        </p>
        <h1
          className="mt-3 text-[26px] font-extrabold leading-tight"
          style={{ fontFamily: "var(--font-montserrat), sans-serif" }}
        >
          Alors, cette soirée&nbsp;? 💬
        </h1>
        <p className="mt-3 text-sm leading-relaxed" style={{ color: "var(--grey)" }}>
          2 minutes pour nous dire ce que tu en as pensé. Tes réponses sont{" "}
          <strong style={{ color: "var(--cream)" }}>100&nbsp;% anonymes</strong>.
        </p>
      </header>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        <QuestionCard num={1} title="Quelle note globale donnes-tu à la soirée ?">
          <StarRating
            value={noteGlobale}
            onChange={setNoteGlobale}
            label="Note globale"
          />
        </QuestionCard>

        <QuestionCard
          num={2}
          title="Recommanderais-tu Soir de Match à un(e) ami(e) célibataire ?"
        >
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Recommandation de 0 à 10">
            {Array.from({ length: 11 }, (_, n) => (
              <button
                key={n}
                type="button"
                role="radio"
                aria-checked={nps === n}
                onClick={() => setNps(n)}
                className="h-10 w-10 rounded-xl text-sm font-bold transition-transform active:scale-90"
                style={{
                  background: nps === n ? "var(--coral)" : "var(--navy2)",
                  color: nps === n ? "var(--navy)" : "var(--grey)",
                }}
              >
                {n}
              </button>
            ))}
          </div>
          <div
            className="mt-2 flex justify-between text-[11px]"
            style={{ color: "var(--mute)" }}
          >
            <span>Pas du tout</span>
            <span>À fond</span>
          </div>
        </QuestionCard>

        <QuestionCard
          num={3}
          title="Les personnes de ton groupe te correspondaient-elles ?"
        >
          <StarRating
            value={qualiteMatch}
            onChange={setQualiteMatch}
            label="Qualité des matchs"
          />
        </QuestionCard>

        <QuestionCard
          num={4}
          title="As-tu fait une rencontre qui te donne envie d'un deuxième rendez-vous ?"
        >
          <div className="flex flex-col gap-2" role="radiogroup" aria-label="Rencontre">
            {RENCONTRE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                role="radio"
                aria-checked={rencontre === opt.value}
                onClick={() => setRencontre(opt.value)}
                className="rounded-xl px-4 py-3 text-left text-sm font-semibold transition-transform active:scale-[0.98]"
                style={{
                  background:
                    rencontre === opt.value ? "var(--coral)" : "var(--navy)",
                  color:
                    rencontre === opt.value ? "var(--navy)" : "var(--cream)",
                  border:
                    rencontre === opt.value
                      ? "1px solid var(--coral)"
                      : "1px solid rgba(196,200,216,0.25)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </QuestionCard>

        <QuestionCard
          num={5}
          title="Que penses-tu du format (groupes d'affinité, déroulé, rythme) ?"
        >
          <StarRating
            value={noteFormat}
            onChange={setNoteFormat}
            label="Note du format"
          />
        </QuestionCard>

        <QuestionCard
          num={6}
          title="Un mot, une idée, une amélioration ? (facultatif)"
        >
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            maxLength={2000}
            rows={4}
            placeholder="Ton ressenti, ce qu'on peut améliorer, un moment marquant…"
            className="w-full resize-y rounded-xl p-3 text-sm outline-none"
            style={{
              background: "var(--navy)",
              color: "var(--cream)",
              border: "1px solid rgba(196,200,216,0.25)",
            }}
          />
        </QuestionCard>

        <div
          className="flex flex-col gap-4 rounded-2xl p-5"
          style={{ background: "var(--navy2)" }}
        >
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
            <input
              type="checkbox"
              checked={consentAvis}
              onChange={(e) => setConsentAvis(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[#f07b5c]"
            />
            <span style={{ color: "var(--grey)" }}>
              J&apos;accepte que mon commentaire soit publié{" "}
              <strong style={{ color: "var(--cream)" }}>anonymement</strong>{" "}
              comme avis (site, réseaux sociaux).
            </span>
          </label>
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed">
            <input
              type="checkbox"
              checked={consentMarketing}
              onChange={(e) => setConsentMarketing(e.target.checked)}
              className="mt-1 h-4 w-4 shrink-0 accent-[#f07b5c]"
            />
            <span style={{ color: "var(--grey)" }}>
              Je veux être tenu(e) au courant des prochaines soirées Soir de
              Match.
            </span>
          </label>
        </div>

        {error && (
          <p
            className="rounded-xl px-4 py-3 text-sm font-semibold"
            style={{ background: "rgba(205,105,115,0.15)", color: "var(--rose)" }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-full py-4 text-base font-extrabold transition-transform active:scale-[0.98] disabled:opacity-60"
          style={{ background: "var(--coral)", color: "var(--navy)" }}
        >
          {submitting ? "Envoi en cours…" : "Envoyer mon avis 💌"}
        </button>

        <p className="mt-1 text-center text-[11px] leading-relaxed" style={{ color: "var(--mute)" }}>
          Réponses anonymes : aucun lien avec ton inscription n&apos;est
          enregistré (minimisation RGPD).
        </p>
      </form>
    </main>
  );
}
