import Link from "next/link";
import HeroScrollytelling from "@/components/HeroScrollytelling";
import LandingSections from "@/components/LandingSections";
import Footer from "@/components/Footer";
import FloatingHearts from "@/components/FloatingHearts";

export default function Home() {
  return (
    <>
      <div className="fixed inset-0 bg-navy -z-[2]" />
      <FloatingHearts />

      <div className="fixed top-5 right-6 z-50 flex items-center gap-2.5">
        <Link
          href="/inscription"
          className="bg-coral text-navy font-montserrat font-bold text-[13px] px-[22px] py-2.5 rounded-full shadow-lg shadow-navy/40"
        >
          Réserver ma place
        </Link>
        <a
          href="https://www.instagram.com/soirdematch/"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Suivez-nous sur Instagram"
          className="grid place-items-center w-[42px] h-[42px] rounded-full text-cream bg-white/10 border border-white/15 backdrop-blur-md shadow-lg shadow-navy/40 transition-colors hover:bg-white/20"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
          </svg>
        </a>
      </div>

      <HeroScrollytelling />
      <LandingSections />
      <Footer />
    </>
  );
}
