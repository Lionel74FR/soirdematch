"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  QUESTIONS,
  validateAnswer,
  type Answers,
  type Question,
} from "@/lib/questionnaire";

type Phase = "form" | "waitlist" | "waitlisted" | "success";

export default function Questionnaire() {
  const [step, setStep] = useState(0); // 0..QUESTIONS.length (last = consent)
  const [answers, setAnswers] = useState<Answers>({});
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [phase, setPhase] = useState<Phase>("form");
  const [cancelled, setCancelled] = useState(false);
  const startFired = useRef(false);

  const total = QUESTIONS.length + 1; // questions + écran de consentement
  const isConsentStep = step === QUESTIONS.length;
  const question: Question | undefined = QUESTIONS[step];
  const progress = Math.round((step / total) * 100);

  // ÉTAPE 2 — StartQuestionnaire au démarrage du formulaire.
  useEffect(() => {
    const status = new URLSearchParams(window.location.search).get("status");
    if (status === "success") {
      setPhase("success");
      return; // écran terminal : on n'ouvre pas le questionnaire.
    }
    if (status === "cancelled") setCancelled(true);

    if (startFired.current) return;
    startFired.current = true;
    // ÉTAPE 2 — StartQuestionnaire uniquement à l'ouverture réelle du formulaire.
    fetch("/api/inscription/start", { method: "POST" }).catch(() => {});
  }, []);

  function setValue(id: string, value: string | string[]) {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setError(null);
  }

  function toggleMulti(q: Question, value: string) {
    const current = Array.isArray(answers[q.id])
      ? (answers[q.id] as string[])
      : [];
    let next: string[];
    if (current.includes(value)) {
      next = current.filter((v) => v !== value);
    } else {
      if (q.maxSelect && current.length >= q.maxSelect) return;
      next = [...current, value];
    }
    setValue(q.id, next);
  }

  function goNext() {
    if (!question) return;
    const err = validateAnswer(question, answers[question.id]);
    if (err) {
      setError(err);
      return;
    }
    setError(null);
    setStep((s) => s + 1);
  }

  function goBack() {
    setError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function selectSingle(q: Question, value: string) {
    setValue(q.id, value);
    // Avancée automatique douce après un choix unique.
    setTimeout(() => setStep((s) => s + 1), 220);
  }

  async function submit(joinWaitlist = false) {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, consent: true, joinWaitlist }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Une erreur est survenue. Réessaie.");
        setSubmitting(false);
        return;
      }
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      if (data.result === "waitlist") {
        setPhase("waitlist");
        setSubmitting(false);
        return;
      }
      if (data.result === "waitlisted") {
        setPhase("waitlisted");
        setSubmitting(false);
        return;
      }
      setSubmitting(false);
    } catch {
      setError("Connexion impossible. Vérifie ta connexion et réessaie.");
      setSubmitting(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && question && question.type !== "multi") {
      e.preventDefault();
      goNext();
    }
  }

  // ----- Écrans terminaux -----
  if (phase === "success") {
    return (
      <Shell>
        <div className="card end">
          <div className="emoji">💘</div>
          <h1>Paiement reçu — tu y es&nbsp;!</h1>
          <p>
            Ta place est réservée. Tu recevras ta confirmation par email, et tes
            matchs te seront révélés le soir de la soirée.
          </p>
          <Link className="btn-p" href="/">
            Retour à l&apos;accueil
          </Link>
        </div>
        <Styles />
      </Shell>
    );
  }

  if (phase === "waitlisted") {
    return (
      <Shell>
        <div className="card end">
          <div className="emoji">⏳</div>
          <h1>Tu es sur la liste d&apos;attente</h1>
          <p>
            Les places pour ton profil sont complètes, mais ça bouge souvent&nbsp;!
            On te préviendra par email dès qu&apos;une place se libère.
          </p>
          <Link className="btn-p" href="/">
            Retour à l&apos;accueil
          </Link>
        </div>
        <Styles />
      </Shell>
    );
  }

  if (phase === "waitlist") {
    return (
      <Shell>
        <div className="card end">
          <div className="emoji">✋</div>
          <h1>Places complètes pour ton profil</h1>
          <p>
            Pour garantir la parité, les places de cette catégorie sont prises.
            Tu peux rejoindre la liste d&apos;attente gratuitement&nbsp;: on te
            préviendra dès qu&apos;une place se libère, avant tout le monde.
          </p>
          {error && <p className="err">{error}</p>}
          <button
            className="btn-p"
            onClick={() => submit(true)}
            disabled={submitting}
          >
            {submitting ? "Un instant…" : "Rejoindre la liste d'attente"}
          </button>
          <button className="btn-link" onClick={() => setPhase("form")}>
            Revenir au formulaire
          </button>
        </div>
        <Styles />
      </Shell>
    );
  }

  // ----- Formulaire -----
  return (
    <Shell>
      <div className="progress">
        <div className="bar" style={{ width: `${progress}%` }} />
      </div>

      {cancelled && (
        <div className="banner">
          Paiement annulé — ta place n&apos;est pas encore réservée. Tu peux
          finaliser ci-dessous.
        </div>
      )}

      <div className="step-count mono">
        {isConsentStep ? "Dernière étape" : `Question ${step + 1} / ${QUESTIONS.length}`}
      </div>

      <div className="card" key={step}>
        {isConsentStep ? (
          <div className="consent">
            <h1>On y est presque.</h1>
            <p className="lead">
              Vérifie ton consentement, puis valide ton inscription.
            </p>

            <label className="consent-box">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  setError(null);
                }}
              />
              <span>
                J&apos;accepte que mes réponses soient utilisées{" "}
                <strong>
                  uniquement pour l&apos;organisation de la soirée et
                  l&apos;appariement des participants
                </strong>
                . Elles sont conservées{" "}
                <strong>30 jours après l&apos;événement</strong> puis
                définitivement supprimées. J&apos;ai pris connaissance de la{" "}
                <Link href="/confidentialite" className="inline-link">
                  politique de confidentialité
                </Link>
                .
              </span>
            </label>

            {error && <p className="err">{error}</p>}

            <div className="nav">
              <button className="btn-s" onClick={goBack} disabled={submitting}>
                Retour
              </button>
              <button
                className="btn-p"
                onClick={() => {
                  if (!consent) {
                    setError(
                      "Tu dois accepter le traitement de tes données pour t'inscrire.",
                    );
                    return;
                  }
                  submit(false);
                }}
                disabled={submitting}
              >
                {submitting ? "Un instant…" : "Valider et payer ma place"}
              </button>
            </div>
          </div>
        ) : (
          question && (
            <div onKeyDown={onKeyDown}>
              {question.group === "affinite" && step === 8 && (
                <div className="phase-tag mono">AFFINITÉS</div>
              )}
              <h1>{question.title}</h1>
              {question.help && <p className="help">{question.help}</p>}

              {(question.type === "text" ||
                question.type === "email" ||
                question.type === "tel") && (
                <input
                  className="text-input"
                  type={question.type}
                  inputMode={
                    question.type === "tel"
                      ? "tel"
                      : question.type === "email"
                        ? "email"
                        : "text"
                  }
                  placeholder={question.placeholder}
                  value={(answers[question.id] as string) || ""}
                  onChange={(e) => setValue(question.id, e.target.value)}
                  autoFocus
                />
              )}

              {question.type === "year" && (
                <select
                  className="text-input"
                  value={(answers[question.id] as string) || ""}
                  onChange={(e) => setValue(question.id, e.target.value)}
                >
                  <option value="" disabled>
                    Choisis ton année
                  </option>
                  {Array.from(
                    { length: (question.maxYear! - question.minYear!) + 1 },
                    (_, i) => question.maxYear! - i,
                  ).map((y) => (
                    <option key={y} value={String(y)}>
                      {y}
                    </option>
                  ))}
                </select>
              )}

              {question.type === "single" && (
                <div className="options">
                  {question.options!.map((o) => (
                    <button
                      key={o.value}
                      className={`opt ${answers[question.id] === o.value ? "sel" : ""}`}
                      onClick={() => selectSingle(question, o.value)}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}

              {question.type === "multi" && (
                <div className="options">
                  {question.options!.map((o) => {
                    const sel =
                      Array.isArray(answers[question.id]) &&
                      (answers[question.id] as string[]).includes(o.value);
                    return (
                      <button
                        key={o.value}
                        className={`opt ${sel ? "sel" : ""}`}
                        onClick={() => toggleMulti(question, o.value)}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              )}

              {error && <p className="err">{error}</p>}

              <div className="nav">
                {step > 0 ? (
                  <button className="btn-s" onClick={goBack}>
                    Retour
                  </button>
                ) : (
                  <Link className="btn-s" href="/">
                    Quitter
                  </Link>
                )}
                {question.type !== "single" && (
                  <button className="btn-p" onClick={goNext}>
                    Continuer
                  </button>
                )}
              </div>
            </div>
          )
        )}
      </div>
      <Styles />
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="wrap">
      <Link href="/" className="brand mono">
        SOIR DE MATCH
      </Link>
      <div className="inner">{children}</div>
    </main>
  );
}

function Styles() {
  return (
    <style jsx global>{`
      .wrap {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 26px 22px 64px;
        background:
          radial-gradient(60% 45% at 50% 0%, rgba(243, 140, 95, 0.16), transparent 70%),
          var(--navy);
      }
      .wrap .brand {
        color: var(--cream);
        text-decoration: none;
        font-size: 13px;
        letter-spacing: 0.3em;
        font-weight: 600;
        opacity: 0.85;
      }
      .wrap .inner {
        width: 100%;
        max-width: 620px;
        margin-top: 48px;
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .progress {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: rgba(255, 255, 255, 0.08);
        z-index: 10;
      }
      .progress .bar {
        height: 100%;
        background: linear-gradient(90deg, var(--rose), var(--coral), var(--orange));
        transition: width 0.45s cubic-bezier(0.22, 1, 0.36, 1);
      }
      .banner {
        background: rgba(205, 105, 115, 0.15);
        border: 1px solid rgba(205, 105, 115, 0.5);
        color: var(--cream);
        border-radius: 14px;
        padding: 12px 16px;
        font-size: 14px;
        margin-bottom: 18px;
      }
      .step-count {
        color: var(--coral);
        font-size: 12px;
        margin-bottom: 14px;
      }
      .card {
        animation: stepIn 0.45s cubic-bezier(0.22, 1, 0.36, 1);
      }
      @keyframes stepIn {
        from {
          opacity: 0;
          transform: translateY(16px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .phase-tag {
        display: inline-block;
        color: var(--gold);
        font-size: 11px;
        border: 1px solid rgba(255, 201, 60, 0.4);
        border-radius: 99px;
        padding: 5px 12px;
        margin-bottom: 16px;
      }
      .card h1 {
        font-size: clamp(26px, 4.4vw, 38px);
        font-weight: 800;
        line-height: 1.1;
        color: var(--cream);
      }
      .card .help,
      .card .lead {
        color: var(--grey);
        font-size: 15.5px;
        line-height: 1.6;
        margin-top: 12px;
      }
      .text-input {
        width: 100%;
        margin-top: 26px;
        background: rgba(36, 42, 70, 0.6);
        border: 1.5px solid rgba(150, 155, 180, 0.3);
        border-radius: 16px;
        padding: 16px 18px;
        color: var(--cream);
        font-size: 17px;
        font-family: var(--font-poppins), sans-serif;
        outline: none;
        transition: border-color 0.2s;
      }
      .text-input:focus {
        border-color: var(--coral);
      }
      select.text-input {
        appearance: none;
        cursor: pointer;
      }
      .options {
        margin-top: 26px;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .opt {
        text-align: left;
        background: rgba(36, 42, 70, 0.55);
        border: 1.5px solid rgba(150, 155, 180, 0.25);
        border-radius: 16px;
        padding: 17px 20px;
        color: var(--cream);
        font-size: 16px;
        font-family: var(--font-poppins), sans-serif;
        cursor: pointer;
        transition: border-color 0.2s, background 0.2s, transform 0.15s;
      }
      .opt:hover {
        border-color: rgba(243, 140, 95, 0.7);
        transform: translateX(3px);
      }
      .opt.sel {
        border-color: var(--coral);
        background: rgba(240, 123, 92, 0.18);
      }
      .nav {
        display: flex;
        gap: 14px;
        margin-top: 30px;
        align-items: center;
      }
      .btn-p {
        background: var(--coral);
        color: var(--navy);
        font-family: var(--font-montserrat), sans-serif;
        font-weight: 700;
        font-size: 15px;
        padding: 15px 28px;
        border-radius: 99px;
        border: none;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
        box-shadow: 0 8px 28px rgba(240, 123, 92, 0.4);
      }
      .btn-p:disabled {
        opacity: 0.6;
        cursor: default;
      }
      .btn-s {
        border: 1px solid rgba(150, 155, 180, 0.5);
        background: transparent;
        color: var(--cream);
        padding: 14px 24px;
        border-radius: 99px;
        font-size: 15px;
        cursor: pointer;
        text-decoration: none;
        display: inline-block;
      }
      .btn-link {
        display: block;
        margin: 16px auto 0;
        background: none;
        border: none;
        color: var(--mute);
        text-decoration: underline;
        cursor: pointer;
        font-size: 14px;
      }
      .err {
        color: #ff9b8a;
        font-size: 14px;
        margin-top: 18px;
      }
      .consent-box {
        display: flex;
        gap: 14px;
        align-items: flex-start;
        margin-top: 26px;
        background: rgba(36, 42, 70, 0.5);
        border: 1px solid rgba(150, 155, 180, 0.25);
        border-radius: 18px;
        padding: 20px;
        cursor: pointer;
      }
      .consent-box input {
        margin-top: 3px;
        width: 20px;
        height: 20px;
        flex-shrink: 0;
        accent-color: var(--coral);
        cursor: pointer;
      }
      .consent-box span {
        color: var(--grey);
        font-size: 14.5px;
        line-height: 1.65;
      }
      .consent-box strong {
        color: var(--cream);
        font-weight: 600;
      }
      .inline-link {
        color: var(--coral);
        text-decoration: underline;
      }
      .card.end {
        text-align: center;
      }
      .card.end .emoji {
        font-size: 54px;
      }
      .card.end h1 {
        margin-top: 16px;
      }
      .card.end p {
        color: var(--grey);
        font-size: 16px;
        line-height: 1.65;
        margin: 16px auto 28px;
        max-width: 460px;
      }
    `}</style>
  );
}
