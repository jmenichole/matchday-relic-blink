"use client";

import { Connection } from "@solana/web3.js";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { fetchRivalryAccount, rivalryPda, RPC_URL } from "@/lib/program";
import { rivalryCssVars, type RivalryMeta } from "@/lib/rivalries";
import { TicketStub } from "@/components/TicketStub";
import { VersusBoard } from "@/components/VersusBoard";
import { WalletProviders } from "@/components/WalletProviders";
import { WalletDeclare } from "@/components/WalletDeclare";

type RivalryBoardProps = {
  rivalry: RivalryMeta;
  origin: string;
};

type BoardState = {
  countA: number | null;
  countB: number | null;
  windowStart: number | null;
  windowEnd: number | null;
  loading: boolean;
  error: string | null;
};

export function RivalryBoard({ rivalry, origin }: RivalryBoardProps) {
  const [state, setState] = useState<BoardState>({
    countA: null,
    countB: null,
    windowStart: null,
    windowEnd: null,
    loading: true,
    error: null,
  });
  const [tick, setTick] = useState(0);

  const load = useCallback(async () => {
    const connection = new Connection(RPC_URL, "confirmed");
    const pda = rivalryPda(rivalry.slug);
    try {
      const account = await fetchRivalryAccount(connection, pda);
      if (!account) {
        setState({
          countA: 0,
          countB: 0,
          windowStart: null,
          windowEnd: null,
          loading: false,
          error: "Rivalry not found on-chain yet. Deploy + seed, then refresh.",
        });
        return;
      }
      setState({
        countA: account.countA,
        countB: account.countB,
        windowStart: account.windowStart,
        windowEnd: account.windowEnd,
        loading: false,
        error: null,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setState((prev) => ({ ...prev, loading: false, error: msg }));
    }
  }, [rivalry.slug]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, []);

  const blinkBaseUrl = useMemo(
    () =>
      `${origin}/api/actions/declare?slug=${encodeURIComponent(rivalry.slug)}`,
    [origin, rivalry.slug],
  );

  const themeVars = useMemo(
    () => rivalryCssVars(rivalry.colors),
    [rivalry.colors],
  );

  const nowSec = Math.floor(Date.now() / 1000) + tick * 0;
  const gateOpen =
    state.windowStart != null &&
    state.windowEnd != null &&
    nowSec >= state.windowStart &&
    nowSec <= state.windowEnd &&
    !state.error?.includes("not found");

  return (
    <WalletProviders>
      <div
        className="board-shell mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14"
        style={themeVars as CSSProperties}
      >
        <TicketStub
          title={rivalry.title}
          sideA={rivalry.sideA}
          sideB={rivalry.sideB}
          slug={rivalry.slug}
          blinkBaseUrl={blinkBaseUrl}
          windowEnd={state.windowEnd}
          loading={state.loading}
        />
        <VersusBoard
          sideA={rivalry.sideA}
          sideB={rivalry.sideB}
          countA={state.countA}
          countB={state.countB}
          loading={state.loading}
        />
        {state.error ? (
          <p className="text-center text-sm text-[var(--warn)]">{state.error}</p>
        ) : null}
        <WalletDeclare
          slug={rivalry.slug}
          sideA={rivalry.sideA}
          sideB={rivalry.sideB}
          gateOpen={Boolean(gateOpen)}
          onDeclared={() => void load()}
        />
        <p className="text-center text-xs tracking-wide text-[var(--ink-dim)]">
          PDA {rivalryPda(rivalry.slug).toBase58()}
        </p>
      </div>
    </WalletProviders>
  );
}
