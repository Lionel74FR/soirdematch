"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function LandingSections() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduced) {
      root
        .querySelectorAll<HTMLElement>(".wbar .fill")
        .forEach((f) => (f.style.width = f.dataset.w || "0"));
      return;
    }

    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(".b").forEach((b, i) => {
        gsap.to(b, {
          opacity: 1,
          y: 0,
          duration: 0.9,
          delay: (i % 2) * 0.12,
          ease: "power3.out",
          scrollTrigger: { trigger: b, start: "top 85%" },
        });
      });
      gsap.utils.toArray<HTMLElement>(".tl .step").forEach((s, i) => {
        gsap.to(s, {
          opacity: 1,
          y: 0,
          duration: 0.8,
          delay: i * 0.14,
          ease: "power3.out",
          scrollTrigger: { trigger: ".tl", start: "top 80%" },
        });
      });
      gsap.utils.toArray<HTMLElement>(".wbar .fill").forEach((f) => {
        gsap.to(f, {
          width: f.dataset.w,
          duration: 1.3,
          ease: "power3.out",
          scrollTrigger: { trigger: f, start: "top 88%" },
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef}>
      {/* ============ CONCEPT ============ */}
      <section id="concept">
        <div className="kicker mono">LE CONCEPT</div>
        <h2>La rencontre est préparée avant la soirée.</h2>
        <p className="sub">Quatre temps, zéro hasard — sauf l&apos;étincelle.</p>
        <div className="bento">
          <div className="b">
            <div className="k mono">T-7 JOURS — EN LIGNE</div>
            <h3>Le questionnaire qui fait le travail</h3>
            <p>
              12 questions, 3 minutes : ce que vous cherchez, ce qui compte
              vraiment, ce qui est rédhibitoire. Votre billet est prépayé, buffet
              inclus — c&apos;est aussi ce qui garantit que tout le monde vient.
            </p>
          </div>
          <div className="b">
            <div className="k mono">T-24H — L&apos;ALGORITHME</div>
            <h3>Vos matchs sont calculés</h3>
            <p>
              Filtres durs puis scoring d&apos;affinité sur 10 dimensions. La
              parité hommes-femmes est verrouillée par quotas.
            </p>
          </div>
          <div className="b">
            <div className="k mono">19H30 — SUR PLACE</div>
            <h3>Bracelet, badge, c&apos;est parti</h3>
            <p>
              À l&apos;arrivée, vous recevez vos matchs et un numéro pour vous
              reconnaître dans la foule. Pas de plan de table : tout le monde
              circule.
            </p>
          </div>
          <div className="b">
            <div className="k mono">JUSQU&apos;AU BOUT DE LA NUIT</div>
            <h3>Buffet, DJ, prolongations</h3>
            <p>
              Format debout, buffet léger inclus, DJ et afterparty. La soirée est
              pensée pour multiplier les conversations — la rencontre fait le
              reste.
            </p>
          </div>
        </div>
      </section>

      {/* ============ ALGORITHME ============ */}
      <section>
        <div className="algo">
          <div className="left">
            <div className="kicker mono">L&apos;ALGORITHME</div>
            <h2>On ne vous présente pas n&apos;importe qui.</h2>
            <p className="sub" style={{ marginTop: 14 }}>
              Avant le scoring, des filtres durs éliminent l&apos;impossible :
              orientation, tranche d&apos;âge, critères rédhibitoires. Ensuite, 10
              dimensions d&apos;affinité pondérées calculent vos compatibilités.
            </p>
          </div>
          <div className="panel">
            <div
              className="mono"
              style={{ fontSize: 12, fontWeight: 700, marginBottom: 22 }}
            >
              PONDÉRATIONS D&apos;AFFINITÉ
            </div>
            <div className="wbar">
              <div className="row">
                <span>Type de relation recherchée</span>
                <b>20/100</b>
              </div>
              <div className="track">
                <div className="fill" data-w="20%" />
              </div>
            </div>
            <div className="wbar">
              <div className="row">
                <span>Valeurs &amp; mode de vie</span>
                <b>14/100</b>
              </div>
              <div className="track">
                <div className="fill" data-w="14%" />
              </div>
            </div>
            <div className="wbar">
              <div className="row">
                <span>Centres d&apos;intérêt</span>
                <b>12/100</b>
              </div>
              <div className="track">
                <div className="fill" data-w="12%" />
              </div>
            </div>
            <div className="wbar">
              <div className="row">
                <span>Énergie sociale</span>
                <b>10/100</b>
              </div>
              <div className="track">
                <div className="fill" data-w="10%" />
              </div>
            </div>
            <p style={{ color: "var(--cream)", fontSize: 14, marginTop: 8 }}>
              ◆ Compatibilité révélée le soir même — jamais avant.
            </p>
          </div>
        </div>
      </section>

      {/* ============ LA SOIRÉE ============ */}
      <section>
        <div className="kicker mono">LA SOIRÉE</div>
        <h2>Coup d&apos;envoi à 19h30.</h2>
        <div className="tl">
          <div className="step">
            <div className="dotline">
              <div className="dot" />
              <div className="line" />
            </div>
            <div className="t">19H30</div>
            <h3>Coup d&apos;envoi</h3>
            <p>Accueil, bracelet et badge. Premier verre, premiers repérages.</p>
          </div>
          <div className="step">
            <div className="dotline">
              <div className="dot" />
              <div className="line" />
            </div>
            <div className="t">20H00</div>
            <h3>Révélation des matchs</h3>
            <p>Vos profils compatibles s&apos;affichent. À vous de jouer.</p>
          </div>
          <div className="step">
            <div className="dotline">
              <div className="dot" />
              <div className="line" />
            </div>
            <div className="t">20H30</div>
            <h3>Buffet &amp; mi-temps</h3>
            <p>Salé, sucré — inclus dans le billet. On souffle, on compare.</p>
          </div>
          <div className="step">
            <div className="dotline">
              <div className="dot" />
            </div>
            <div className="t">22H00</div>
            <h3>DJ &amp; afterparty</h3>
            <p>La lumière baisse, le son monte. Prolongations autorisées.</p>
          </div>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section>
        <div className="kicker mono">FAQ</div>
        <h2>Les questions qu&apos;on nous pose.</h2>
        <details>
          <summary>Je viens seul(e) ?</summary>
          <p>
            Oui — tout le monde vient seul, c&apos;est le principe. Le bracelet et
            vos matchs brisent la glace pour vous.
          </p>
        </details>
        <details>
          <summary>Et si je ne plais à aucun de mes matchs ?</summary>
          <p>
            Vos matchs sont un point de départ, pas une obligation : la soirée est
            ouverte, vous parlez à qui vous voulez.
          </p>
        </details>
        <details>
          <summary>Qui voit mes réponses au questionnaire ?</summary>
          <p>
            Personne. Elles servent uniquement au calcul des compatibilités et
            sont supprimées 30 jours après la soirée. Données hébergées en France.
          </p>
        </details>
        <details>
          <summary>Le billet comprend quoi ?</summary>
          <p>
            L&apos;entrée, le buffet salé/sucré et l&apos;accès à l&apos;afterparty.
            Les boissons sont au bar.
          </p>
        </details>
      </section>

      {/* ============ CTA FINAL ============ */}
      <section className="final" id="reserver">
        <h2>CE SOIR, J&apos;AI MATCH.</h2>
        <p>
          Jeudi 9 juillet · Le Chardon d&apos;Écosse, Annecy · Places limitées,
          parité garantie.
        </p>
        <Link className="btn-p" href="/inscription">
          Je réserve ma place
        </Link>
      </section>

      <style jsx>{`
        section {
          padding: 110px 7vw;
          max-width: 1440px;
          margin: 0 auto;
        }
        .kicker {
          color: var(--coral);
          font-size: 12px;
          margin-bottom: 14px;
        }
        h2 {
          font-size: clamp(32px, 4vw, 46px);
          font-weight: 700;
          margin-bottom: 10px;
        }
        .sub {
          color: var(--grey);
          font-size: 17px;
        }
        .bento {
          display: grid;
          grid-template-columns: 1.6fr 1fr;
          gap: 22px;
          margin-top: 44px;
        }
        .bento .b:nth-child(3) {
          grid-column: 1;
        }
        .bento .b:nth-child(4) {
          grid-column: 2;
          grid-row: 2;
        }
        @media (max-width: 860px) {
          .bento {
            grid-template-columns: 1fr;
          }
          .bento .b {
            grid-column: auto !important;
            grid-row: auto !important;
          }
        }
        .b {
          background: rgba(36, 42, 70, 0.5);
          border: 1.2px solid rgba(205, 105, 115, 0.35);
          border-radius: 28px;
          padding: 32px;
          transition: transform 0.35s, border-color 0.35s;
          opacity: 0;
          transform: translateY(36px);
        }
        .b:hover {
          transform: translateY(-6px) !important;
          border-color: rgba(243, 140, 95, 0.7);
        }
        .b .k {
          color: var(--coral);
          font-size: 12px;
          font-weight: 700;
        }
        .b h3 {
          font-size: 23px;
          margin: 10px 0 8px;
          font-weight: 600;
        }
        .b p {
          color: var(--grey);
          font-size: 14.5px;
          line-height: 1.6;
        }
        .algo {
          display: flex;
          gap: 60px;
          align-items: center;
          flex-wrap: wrap;
          background: #0f1320;
          border-radius: 36px;
          padding: 64px;
        }
        .algo .left {
          flex: 1;
          min-width: 300px;
        }
        .algo .panel {
          flex: 1;
          min-width: 320px;
          background: rgba(36, 42, 70, 0.5);
          border: 1.2px solid rgba(243, 140, 95, 0.4);
          border-radius: 28px;
          padding: 34px;
        }
        .wbar {
          margin-bottom: 18px;
        }
        .wbar .row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 6px;
          color: var(--grey);
        }
        .wbar .row b {
          color: var(--gold);
          font-family: var(--font-space-mono), monospace;
        }
        .wbar .track {
          height: 7px;
          background: rgba(255, 255, 255, 0.07);
          border-radius: 99px;
          overflow: hidden;
        }
        .wbar .fill {
          height: 100%;
          width: 0;
          border-radius: 99px;
          background: linear-gradient(90deg, var(--rose), var(--orange));
        }
        .tl {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 28px;
          margin-top: 50px;
        }
        .tl .step {
          opacity: 0;
          transform: translateY(30px);
        }
        .tl .t {
          color: var(--gold);
          font-family: var(--font-space-mono), monospace;
          font-size: 15px;
          margin: 12px 0 6px;
        }
        .tl h3 {
          font-size: 20px;
          font-weight: 600;
        }
        .tl p {
          color: var(--grey);
          font-size: 14px;
          line-height: 1.55;
          margin-top: 6px;
        }
        .tl .dotline {
          display: flex;
          align-items: center;
        }
        .tl .dot {
          width: 13px;
          height: 13px;
          border-radius: 50%;
          background: var(--coral);
        }
        .tl .step:first-child .dot {
          background: var(--gold);
        }
        .tl .line {
          flex: 1;
          height: 2px;
          background: rgba(150, 155, 180, 0.25);
          margin-left: 8px;
        }
        details {
          background: rgba(36, 42, 70, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 20px;
          padding: 20px 28px;
          margin-top: 14px;
        }
        summary {
          cursor: pointer;
          font-weight: 500;
          font-size: 17px;
          list-style: none;
          display: flex;
          justify-content: space-between;
        }
        summary::after {
          content: "+";
          color: var(--coral);
          font-family: var(--font-montserrat), sans-serif;
          font-weight: 600;
          font-size: 22px;
        }
        details[open] summary::after {
          content: "–";
        }
        details p {
          color: var(--grey);
          font-size: 15px;
          line-height: 1.6;
          margin-top: 12px;
          max-width: 900px;
        }
        .final {
          text-align: center;
          background: linear-gradient(180deg, var(--navy), #2e1f29);
          border-radius: 40px;
        }
        .final h2 {
          font-size: clamp(36px, 5vw, 58px);
          letter-spacing: 0.02em;
        }
        .final p {
          color: var(--grey);
          margin: 14px 0 30px;
        }
        .btn-p {
          background: var(--coral);
          color: var(--navy);
          font-family: var(--font-montserrat), sans-serif;
          font-weight: 700;
          padding: 16px 32px;
          border-radius: 99px;
          text-decoration: none;
          box-shadow: 0 8px 34px rgba(240, 123, 92, 0.45);
          display: inline-block;
        }
        @media (prefers-reduced-motion: reduce) {
          .b,
          .tl .step {
            opacity: 1;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
