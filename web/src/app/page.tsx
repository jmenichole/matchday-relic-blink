import type { CSSProperties } from "react";
import { RIVALRIES, rivalryCssVars } from "@/lib/rivalries";

const FEATURED = RIVALRIES[0];

const STEPS = [
  {
    n: "01",
    title: "Open a Matchday window",
    body: "Each rivalry has a live gate. Claims only count while it is open.",
  },
  {
    n: "02",
    title: "Declare your side",
    body: "On the match board, pick a team, connect your wallet, and stamp a Relic. A Blink is just a shareable claim button for the same action.",
  },
  {
    n: "03",
    title: "Earn an on-chain Relic",
    body: "Solana stamps your allegiance as a Relic PDA. After the whistle, that stamp can no longer be earned.",
  },
] as const;

export default function Home() {
  return (
    <main className="relative min-h-screen">
      <div className="stadium-glow" aria-hidden />
      <div className="relative mx-auto w-full max-w-3xl px-6 pb-20 pt-16 sm:pt-20">
        <section className="landing-hero flex min-h-[72vh] flex-col justify-center gap-8">
          <p className="landing-brand">Matchday Relic</p>
          <div className="max-w-xl space-y-4">
            <h1 className="landing-headline">
              Passion is showing up while it counts.
            </h1>
            <p className="landing-lede">
              During a live Matchday window, declare your side and stamp an
              on-chain Relic on Solana. When the gate closes, allegiance is
              locked - forever.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <a
              className="ticket-cta landing-cta"
              href={`/r/${FEATURED.slug}`}
              style={rivalryCssVars(FEATURED.colors) as CSSProperties}
            >
              Enter {FEATURED.title}
            </a>
            <a className="landing-secondary" href="#how-it-works">
              How it works
            </a>
          </div>
        </section>

        <section
          id="how-it-works"
          className="landing-section scroll-mt-10"
          aria-labelledby="how-heading"
        >
          <h2 id="how-heading" className="landing-section-title">
            How it works
          </h2>
          <p className="landing-section-lede">
            A tiny on-chain ritual for rivalries - World Cup or fandom wars.
            Same mechanic either way.
          </p>
          <ol className="landing-steps">
            {STEPS.map((step) => (
              <li key={step.n} className="landing-step">
                <span className="landing-step-n" aria-hidden>
                  {step.n}
                </span>
                <div>
                  <p className="landing-step-title">{step.title}</p>
                  <p className="landing-step-body">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="landing-section" aria-labelledby="why-heading">
          <h2 id="why-heading" className="landing-section-title">
            Why Solana
          </h2>
          <p className="landing-section-lede max-w-lg">
            The Matchday window is enforced by Solana&apos;s clock - not a
            website timer you can game. Claim here with your wallet. Share a
            Blink only when you want friends to hit the same claim button from
            a feed.
          </p>
        </section>

        <section
          className="landing-section"
          aria-labelledby="rivalries-heading"
        >
          <h2 id="rivalries-heading" className="landing-section-title">
            Pick a rivalry
          </h2>
          <p className="landing-section-lede">
            Jump onto a board, watch live tallies, and claim before the gate
            locks.
          </p>
          <ul className="mt-6 grid gap-4">
            {RIVALRIES.map((rivalry) => (
              <li
                key={rivalry.slug}
                style={rivalryCssVars(rivalry.colors) as CSSProperties}
              >
                <a
                  className="rivalry-link"
                  href={`/r/${rivalry.slug}`}
                  aria-label={`Open ${rivalry.title} board`}
                >
                  <span className="font-[family-name:var(--font-display)] text-2xl tracking-wide">
                    {rivalry.title}
                  </span>
                  <span className="rivalry-link-sides">
                    <span className="side-a-label">{rivalry.sideA}</span>
                    <span className="text-[var(--ink-dim)]">vs</span>
                    <span className="side-b-label">{rivalry.sideB}</span>
                  </span>
                  <span className="rivalry-link-cta">Open match board</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
