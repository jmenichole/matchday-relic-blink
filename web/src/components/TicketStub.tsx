"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TicketStubProps = {
  title: string;
  sideA: string;
  sideB: string;
  slug: string;
  windowEnd: number | null;
  loading?: boolean;
};

function formatCountdown(seconds: number): string {
  if (seconds <= 0) return "00:00:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h, m, s].map((n) => String(n).padStart(2, "0")).join(":");
}

export function TicketStub({
  title,
  sideA,
  sideB,
  slug,
  windowEnd,
  loading,
}: TicketStubProps) {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  const remaining = windowEnd == null ? null : windowEnd - now;
  const closed = remaining != null && remaining <= 0;

  return (
    <section className="ticket-stub relative overflow-hidden px-8 py-10 sm:px-12 sm:py-14">
      <div className="ticket-perforation" aria-hidden />
      <p className="ticket-brand">Matchday Relic</p>
      <h1 className="ticket-title mt-3 max-w-xl">{title}</h1>
      <p className="mt-4 font-[family-name:var(--font-body)] text-base tracking-wide text-[var(--ink-muted)] sm:text-lg">
        <span className="text-[var(--side-a)]">{sideA}</span>{" "}
        <span className="text-[var(--accent)]">vs</span>{" "}
        <span className="text-[var(--side-b)]">{sideB}</span>
      </p>

      <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28em] text-[var(--ink-dim)]">
            Gate clock
          </p>
          <p className="mt-2 font-[family-name:var(--font-display)] text-4xl tabular-nums tracking-wider text-[var(--ink)] sm:text-5xl">
            {loading || remaining == null
              ? "-:-:-"
              : closed
                ? "LOCKED"
                : formatCountdown(remaining)}
          </p>
        </div>

        <div className="ticket-cta-group">
          {loading ? (
            <button type="button" disabled className="ticket-cta ticket-cta-disabled">
              Checking gate.
            </button>
          ) : closed || remaining == null ? (
            <button type="button" disabled className="ticket-cta ticket-cta-disabled">
              Gate closed - Relics locked
            </button>
          ) : (
            <>
              <a className="ticket-cta" href="#claim">
                Claim with wallet
              </a>
              <Link className="ticket-blink-link" href={`/blink/${slug}`}>
                Open Blink claim (explained)
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
