import Link from "next/link";
import { notFound } from "next/navigation";
import { RivalryBoard } from "@/components/RivalryBoard";
import { getRivalry } from "@/lib/rivalries";
import { headers } from "next/headers";

export default async function RivalryPage({
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

  return (
    <main className="relative min-h-screen">
      <div className="stadium-glow" aria-hidden />
      <div className="relative px-4 pt-6">
        <Link
          href="/"
          className="text-sm tracking-wide text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          All rivalries
        </Link>
      </div>
      <RivalryBoard rivalry={rivalry} origin={origin} />
    </main>
  );
}