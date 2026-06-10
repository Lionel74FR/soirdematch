import Link from "next/link";
import Footer from "@/components/Footer";

export default function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <div className="fixed inset-0 bg-navy -z-[2]" />

      <nav className="fixed top-0 left-0 right-0 z-50 flex justify-between items-center px-12 py-[18px] backdrop-blur-md bg-navy/45 border-b border-white/[0.06]">
        <Link
          href="/"
          className="font-montserrat font-semibold tracking-[0.3em] text-sm"
        >
          SOIR DE MATCH
        </Link>
        <Link
          href="/inscription"
          className="bg-coral text-navy font-montserrat font-bold text-[13px] px-[22px] py-2.5 rounded-full"
        >
          Réserver ma place
        </Link>
      </nav>

      <main className="max-w-3xl mx-auto px-6 pt-28 pb-20">
        <h1 className="font-montserrat font-bold text-3xl text-cream">
          {title}
        </h1>
        {updated && (
          <p className="text-sm text-[var(--mute)] mt-2">
            Dernière mise à jour : {updated}
          </p>
        )}
        <div className="legal mt-8">{children}</div>
      </main>

      <Footer />
    </>
  );
}
