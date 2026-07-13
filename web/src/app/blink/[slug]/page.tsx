import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import type { CSSProperties } from "react";
import { BlinkClaim } from "@/components/BlinkClaim";
import { WalletProviders } from "@/components/WalletProviders";
import { getRivalry, rivalryCssVars } from "@/lib/rivalries";

export default async function BlinkPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rivalry = getRivalry(slug);
  if (!rivalry) notFound();

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const origin =
    process.env.NEXT_PUBLIC_SITE_URL ?? `${proto}://${host}`;
  const actionUrl = `${origin}/api/actions/declare?slug=${encodeURIComponent(slug)}`;

  return (
    <main className="relative min-h-screen">
      <div className="stadium-glow" aria-hidden />
      <div
        className="relative z-10 mx-auto w-full max-w-2xl px-4 py-8 sm:px-6"
        style={rivalryCssVars(rivalry.colors) as CSSProperties}
      >
        <Link
          href={`/r/${slug}`}
          className="text-sm tracking-wide text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          ← Back to {rivalry.title} board
        </Link>
        <p className="landing-brand mt-8">Matchday Relic · Blink</p>
        <h1 className="ticket-title mt-2">{rivalry.title}</h1>
        <p className="mt-3 text-[var(--ink-muted)]">
          <span className="text-[var(--side-a)]">{rivalry.sideA}</span>
          {" vs "}
          <span className="text-[var(--side-b)]">{rivalry.sideB}</span>
        </p>
        <WalletProviders>
          <BlinkClaim rivalry={rivalry} actionUrl={actionUrl} />
        </WalletProviders>
      </div>
    </main>
  );
}
