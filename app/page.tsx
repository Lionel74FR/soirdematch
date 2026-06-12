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

      <Link
        href="/inscription"
        className="fixed top-5 right-6 z-50 bg-coral text-navy font-montserrat font-bold text-[13px] px-[22px] py-2.5 rounded-full shadow-lg shadow-navy/40"
      >
        Réserver ma place
      </Link>

      <HeroScrollytelling />
      <LandingSections />
      <Footer />
    </>
  );
}
