import Link from "next/link";
import { RIVALRIES } from "@/lib/rivalries";

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <div className="stadium-glow" aria-hidden />
      <div className="relative mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center gap-10 px-6 py-16">
        <header>
          <p className="font-[family-name:var(--font-display)] text-5xl tracking-[0.08em] text-[var(--ink)] sm:text-6xl">
            Matchday Relic
          </p>
          <p className="mt-4 max-w-md font-[family-name:var(--font-body)] text-base text-[var(--ink-muted)] sm:text-lg">
            Pick a rivalry. Claim your Relic before the gate closes.
          </p>
        </header>

        <ul className="grid gap-4">
          {RIVALRIES.map((rivalry) => (
            <li key={rivalry.slug}>
              <Link className="rivalry-link" href={`/r/${rivalry.slug}`}>
                <span className="font-[family-name:var(--font-display)] text-2xl tracking-wide">
                  {rivalry.title}
                </span>
                <span className="mt-1 block text-sm text-[var(--ink-muted)]">
                  {rivalry.sideA} vs {rivalry.sideB}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
