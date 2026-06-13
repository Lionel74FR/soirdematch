"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ScrollToPlugin } from "gsap/ScrollToPlugin";

export default function HeroScrollytelling() {
  const rootRef = useRef<HTMLDivElement>(null);

  // Clic sur le hero : joue l'animation automatiquement (en faisant défiler
  // jusqu'à la fin du « scrollStage », là où le titre « Ce soir, j'ai match »
  // est révélé). Le scroll manuel reste possible.
  const playToReveal = (e: React.MouseEvent<HTMLDivElement>) => {
    // Ne pas intercepter les clics sur les liens/boutons une fois révélés.
    if ((e.target as HTMLElement).closest("a, button")) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduced) return; // le hero est déjà affiché en entier

    const stage = document.getElementById("scrollStage");
    if (!stage) return;

    const target = stage.offsetTop + stage.offsetHeight - window.innerHeight;
    if (Math.abs(window.scrollY - target) < 4) return; // déjà au bout

    gsap.registerPlugin(ScrollToPlugin);
    gsap.to(window, {
      scrollTo: { y: target, autoKill: true },
      duration: 2.2,
      ease: "power2.inOut",
    });
  };

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduced) {
      root
        .querySelectorAll<HTMLElement>(".hud .fill")
        .forEach((f) => (f.style.width = f.dataset.w || "0"));
      return;
    }

    gsap.registerPlugin(ScrollTrigger, ScrollToPlugin);

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: "#scrollStage",
          start: "top top",
          end: "bottom bottom",
          scrub: 0.6,
        },
      });

      // 1. Les moitiés s'écartent, le faisceau s'élargit
      tl.to("#silL", { xPercent: -180, rotation: -5, opacity: 0, ease: "power2.in", duration: 3 }, 0)
        .to("#silR", { xPercent: 180, rotation: 5, opacity: 0, ease: "power2.in", duration: 3 }, 0)
        .to("#beam", { scaleX: 5, opacity: 0.5, ease: "power1.inOut", duration: 3 }, 0)
        .to("#hint", { opacity: 0, duration: 0.6 }, 0)

        // 2. Le cœur rejoint le centre puis zoome en battant plus vite
        .to("#heart", { top: "50%", ease: "power1.inOut", duration: 1.6 }, 0.4)
        .to("#heart", { scale: 16, ease: "power2.in", duration: 4 }, 0.8)
        .to("#heart", { opacity: 0, ease: "power1.in", duration: 1.2 }, 3.6)
        .to("#beam", { opacity: 0, duration: 1 }, 3.4)

        // 3. Révélation du hero
        .to("#reveal", { opacity: 1, pointerEvents: "auto", duration: 1.6 }, 3.9)
        .from("#reveal h1", { y: 60, opacity: 0, duration: 1.4 }, 4.0)
        .from("#reveal .chip", { y: 24, opacity: 0, duration: 1 }, 4.1)
        .from("#reveal p, #reveal .ctas", { y: 36, opacity: 0, stagger: 0.15, duration: 1.1 }, 4.3)
        .from("#reveal .hud", { y: 50, opacity: 0, duration: 1.2 }, 4.6);

      // Battement qui s'accélère avec le zoom
      ScrollTrigger.create({
        trigger: "#scrollStage",
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (s) => {
          const img = root.querySelector<HTMLElement>("#heart img");
          if (img) img.style.animationDuration = 1.1 - s.progress * 0.65 + "s";
        },
      });

      // Jauges du HUD
      gsap.utils.toArray<HTMLElement>(".hud .fill").forEach((f) => {
        gsap.to(f, {
          width: f.dataset.w,
          duration: 1.4,
          ease: "power3.out",
          scrollTrigger: { trigger: "#reveal", start: "top 40%" },
        });
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={rootRef}>
      <div className="scroll-stage" id="scrollStage">
        <div
          className="stage"
          onClick={playToReveal}
          role="button"
          tabIndex={-1}
          aria-label="Lancer l'animation et révéler la soirée"
        >
          <div className="bg-glow" />
          <div className="beam" id="beam" />
          <div className="badge-wrap" id="badgeWrap">
            <img
              className="half"
              id="silL"
              src="/web-moitie-gauche.png"
              alt="Moitié gauche du badge Soir de Match"
            />
            <img
              className="half"
              id="silR"
              src="/web-moitie-droite.png"
              alt="Moitié droite du badge Soir de Match"
            />
            <div id="heart">
              <img src="/web-coeur.svg" alt="Cœur Soir de Match" />
            </div>
          </div>
          <div className="scroll-hint mono" id="hint">
            CLIQUEZ — LA RENCONTRE COMMENCE
          </div>

          <div className="reveal" id="reveal">
            <span className="chip mono">
              <i />
              JEUDI 9 JUILLET · 19H30 — LE CHARDON D&apos;ÉCOSSE, ANNECY
            </span>
            <h1>
              Ce soir,
              <br />
              <span className="grad">j&apos;ai match.</span>
            </h1>
            <p>
              La soirée célibataires d&apos;Annecy où l&apos;algorithme a déjà
              fait les présentations. Buffet inclus, DJ, afterparty — il ne reste
              que l&apos;étincelle.
            </p>
            <div className="ctas">
              <Link className="btn-p" href="/inscription">
                Je réserve ma place
              </Link>
              <Link className="btn-s" href="#concept">
                Comment ça marche
              </Link>
            </div>
            <div className="hud">
              <div className="head">
                <span className="mono">PLACES EN DIRECT</span>
                <span className="live mono">
                  <i />
                  LIVE
                </span>
              </div>
              <div className="gauge h">
                <div className="row">
                  <span>Hommes</span>
                  <span className="mono">18 / 40</span>
                </div>
                <div className="track">
                  <div className="fill" data-w="45%" />
                </div>
              </div>
              <div className="gauge f">
                <div className="row">
                  <span>Femmes</span>
                  <span className="mono">13 / 40</span>
                </div>
                <div className="track">
                  <div className="fill" data-w="33%" />
                </div>
              </div>
              <div className="rest">49 places restantes</div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .scroll-stage {
          height: 420vh;
          position: relative;
        }
        .stage {
          position: sticky;
          top: 0;
          height: 100vh;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .bg-glow {
          position: absolute;
          inset: 0;
          background: radial-gradient(
              60% 50% at 50% 118%,
              rgba(243, 140, 95, 0.38),
              transparent 70%
            ),
            radial-gradient(
              40% 35% at 12% -5%,
              rgba(205, 105, 115, 0.25),
              transparent 70%
            );
        }
        .beam {
          position: absolute;
          top: -12vh;
          left: 50%;
          transform: translateX(-50%);
          width: 34vmin;
          height: 120vh;
          background: linear-gradient(
            to bottom,
            rgba(255, 232, 161, 0.32),
            rgba(255, 232, 161, 0) 75%
          );
          clip-path: polygon(42% 0, 58% 0, 100% 100%, 0 100%);
          filter: blur(14px);
        }
        .badge-wrap {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: min(72vmin, 560px);
          aspect-ratio: 1;
          will-change: transform;
        }
        .half {
          position: absolute;
          top: 0;
          height: 100%;
          will-change: transform, opacity;
          filter: drop-shadow(0 24px 60px rgba(0, 0, 0, 0.45));
        }
        #silL {
          right: 50%;
        }
        #silR {
          left: 50%;
        }
        #heart {
          position: absolute;
          left: 50%;
          top: 69.4%;
          width: 10.5%;
          transform: translate(-50%, -50%);
          filter: drop-shadow(0 0 18px rgba(247, 91, 86, 0.85));
          z-index: 5;
          will-change: transform;
        }
        #heart :global(img) {
          width: 100%;
          display: block;
          animation: beat 1.1s ease-in-out infinite;
          transform-origin: center;
        }
        @keyframes beat {
          0%,
          100% {
            transform: scale(1);
          }
          12% {
            transform: scale(1.14);
          }
          24% {
            transform: scale(0.98);
          }
          36% {
            transform: scale(1.1);
          }
          50% {
            transform: scale(1);
          }
        }
        .scroll-hint {
          position: absolute;
          bottom: 5vh;
          left: 50%;
          transform: translateX(-50%);
          color: var(--mute);
          font-size: 12px;
          letter-spacing: 0.25em;
          text-align: center;
        }
        .scroll-hint::after {
          content: "";
          display: block;
          width: 1px;
          height: 38px;
          margin: 10px auto 0;
          background: linear-gradient(var(--mute), transparent);
        }
        .reveal {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          opacity: 0;
          pointer-events: none;
          padding: 0 24px;
          z-index: 6;
        }
        .reveal .chip {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          border: 1px solid rgba(240, 123, 92, 0.5);
          background: rgba(36, 42, 70, 0.7);
          border-radius: 99px;
          padding: 9px 18px;
          font-size: 12px;
          color: var(--gold);
        }
        .reveal .chip i {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--gold);
          display: inline-block;
        }
        .reveal h1 {
          font-size: clamp(52px, 9vw, 110px);
          font-weight: 800;
          line-height: 1.02;
          margin: 26px 0 18px;
        }
        .reveal h1 .grad {
          background: linear-gradient(
            100deg,
            var(--rose),
            var(--coral) 55%,
            var(--orange)
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
        }
        .reveal p {
          max-width: 560px;
          color: var(--grey);
          font-size: 17px;
          line-height: 1.65;
        }
        .reveal .ctas {
          display: flex;
          gap: 16px;
          margin-top: 30px;
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
        }
        .btn-s {
          border: 1px solid rgba(150, 155, 180, 0.5);
          color: var(--cream);
          padding: 15px 28px;
          border-radius: 99px;
          text-decoration: none;
          font-size: 15px;
        }
        .hud {
          margin-top: 40px;
          background: rgba(36, 42, 70, 0.55);
          border: 1.5px solid;
          border-image: linear-gradient(
              120deg,
              rgba(205, 105, 115, 0.8),
              rgba(243, 140, 95, 0.8)
            )
            1;
          border-radius: 24px;
          padding: 22px 28px;
          backdrop-filter: blur(20px);
          width: min(420px, 90vw);
          text-align: left;
        }
        .hud .head {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
        }
        .hud .live {
          color: #66e68c;
        }
        .hud .live i {
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #66e68c;
          margin-right: 6px;
          animation: blink 1.6s infinite;
        }
        @keyframes blink {
          50% {
            opacity: 0.3;
          }
        }
        .gauge {
          margin-top: 16px;
        }
        .gauge .row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          margin-bottom: 6px;
        }
        .gauge .track {
          height: 8px;
          border-radius: 99px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
        }
        .gauge .fill {
          height: 100%;
          border-radius: 99px;
          width: 0;
        }
        .gauge.h .fill {
          background: var(--coral);
        }
        .gauge.f .fill {
          background: var(--rose);
        }
        .hud .rest {
          margin-top: 16px;
          color: var(--gold);
          font-family: var(--font-montserrat), sans-serif;
          font-weight: 600;
          font-size: 16px;
        }
        @media (prefers-reduced-motion: reduce) {
          .scroll-stage {
            height: auto;
          }
          .stage {
            position: relative;
            height: auto;
            padding: 140px 24px 60px;
          }
          .beam {
            display: none;
          }
          .reveal {
            position: relative;
            opacity: 1;
            pointer-events: auto;
          }
          #heart :global(img) {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
