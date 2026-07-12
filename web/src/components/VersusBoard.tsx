"use client";

type VersusBoardProps = {
  sideA: string;
  sideB: string;
  countA: number | null;
  countB: number | null;
  loading?: boolean;
};

export function VersusBoard({
  sideA,
  sideB,
  countA,
  countB,
  loading,
}: VersusBoardProps) {
  const a = countA ?? 0;
  const b = countB ?? 0;
  const total = a + b;
  const aPct = total === 0 ? 50 : Math.round((a / total) * 100);
  const bPct = 100 - aPct;

  return (
    <section className="versus-board px-6 py-10 sm:px-10">
      <p className="text-center text-xs uppercase tracking-[0.3em] text-[var(--ink-dim)]">
        Live allegiance
      </p>
      <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
        <div className="versus-panel versus-panel-a text-right">
          <p className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-[var(--side-a)] sm:text-3xl">
            {sideA}
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-5xl tabular-nums text-[var(--ink)] sm:text-6xl">
            {loading ? "—" : a}
          </p>
        </div>

        <div className="versus-badge flex h-16 w-16 items-center justify-center rounded-full font-[family-name:var(--font-display)] text-lg tracking-widest text-[var(--accent)] sm:h-20 sm:w-20 sm:text-xl">
          VS
        </div>

        <div className="versus-panel versus-panel-b text-left">
          <p className="font-[family-name:var(--font-display)] text-2xl tracking-wide text-[var(--side-b)] sm:text-3xl">
            {sideB}
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-5xl tabular-nums text-[var(--ink)] sm:text-6xl">
            {loading ? "—" : b}
          </p>
        </div>
      </div>

      <div className="mt-10 h-2 overflow-hidden rounded-sm bg-[var(--panel-deep)]">
        <div className="flex h-full w-full">
          <div
            className="h-full bg-[var(--side-a)] transition-[width] duration-700 ease-out"
            style={{ width: `${aPct}%` }}
          />
          <div
            className="h-full bg-[var(--side-b)] transition-[width] duration-700 ease-out"
            style={{ width: `${bPct}%` }}
          />
        </div>
      </div>
    </section>
  );
}
