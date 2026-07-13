import Link from "next/link";
import { notFound } from "next/navigation";
import { RivalryBoard } from "@/components/RivalryBoard";
import { getRivalry } from "@/lib/rivalries";

export default async function RivalryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const rivalry = getRivalry(slug);
  if (!rivalry) notFound();

  return (
    <main className="relative min-h-screen">
      <div className="stadium-glow" aria-hidden />
      <div className="relative z-10 px-4 pt-6">
        <Link
          href="/"
          className="text-sm tracking-wide text-[var(--ink-muted)] hover:text-[var(--ink)]"
        >
          All rivalries
        </Link>
      </div>
      <div className="relative z-10">
        <RivalryBoard rivalry={rivalry} />
      </div>
    </main>
  );
}
