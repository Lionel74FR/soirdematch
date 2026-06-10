import Link from "next/link";
import HeroScrollytelling from "@/components/HeroScrollytelling";
import LandingSections from "@/components/LandingSections";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <div className="fixed inset-0 bg-navy -z-[2]" />

      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-12 py-[18px] backdrop-blur-md bg-navy/45 border-b border-white/[0.06]">
        <span className="font-montserrat font-semibold tracking-[0.3em] text-sm">
          SOIR DE MATCH
        </span>
        <Link
          href="/inscription"
          className="bg-coral text-navy font-montserrat font-bold text-[13px] px-[22px] py-2.5 rounded-full"
        >
          Réserver ma place
        </Link>
      </nav>

      <HeroScrollytelling />
      <LandingSections />
      <Footer />
    </>
  );
}
