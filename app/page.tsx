export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      <h1 className="font-montserrat text-5xl font-extrabold text-navy">
        Next.js 14 + Vercel
      </h1>
      <p className="font-poppins text-lg text-navy2">
        App Router · TypeScript · Tailwind CSS · Drizzle · Stripe · Resend
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <span className="rounded-full bg-coral px-4 py-2 font-space-mono text-sm text-cream">
          coral
        </span>
        <span className="rounded-full bg-rose px-4 py-2 font-space-mono text-sm text-cream">
          rose
        </span>
        <span className="rounded-full bg-orange px-4 py-2 font-space-mono text-sm text-cream">
          orange
        </span>
        <span className="rounded-full bg-gold px-4 py-2 font-space-mono text-sm text-navy">
          gold
        </span>
      </div>
    </main>
  );
}
