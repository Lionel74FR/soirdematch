import Link from "next/link";

export default function Footer() {
  return (
    <footer className="flex flex-wrap justify-between gap-2.5 px-[7vw] py-7 border-t border-white/[0.07] text-[13px] text-[var(--mute)]">
      <span>© 2026 Soir de Match — un événement Matalon Events</span>
      <span className="flex flex-wrap gap-2">
        <a
          href="https://www.instagram.com/soirdematch/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-cream transition-colors"
        >
          Instagram
        </a>
        <span aria-hidden>·</span>
        <Link href="/mentions-legales" className="hover:text-cream transition-colors">
          Mentions légales
        </Link>
        <span aria-hidden>·</span>
        <Link href="/confidentialite" className="hover:text-cream transition-colors">
          Confidentialité
        </Link>
      </span>
    </footer>
  );
}
