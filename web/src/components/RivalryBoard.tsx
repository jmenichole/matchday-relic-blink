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
import { BoardExplainer } from "@/components/BoardExplainer";
import { TicketStub } from "@/components/TicketStub";
import { VersusBoard } from "@/components/VersusBoard";
import { WalletProviders } from "@/components/WalletProviders";
import { WalletDeclare } from "@/components/WalletDeclare";

type RivalryBoardProps = {
  rivalry: RivalryMeta;
};

type BoardState = {
  countA: number | null;
  countB: number | null;
  windowStart: number | null;
  windowEnd: number | null;
  loading: boolean;
  error: string | null;
};

export function RivalryBoard({ rivalry }: RivalryBoardProps) {
  const [state, setState] = useState<BoardState>({
    countA: null,
    countB: null,
    windowStart: null,
    windowEnd: null,
    loading: true,
    error: null,
  });
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));

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
      // Keep last known window so a flaky RPC does not disable claim.
      setState((prev) => ({
        ...prev,
        loading: false,
        error: prev.windowStart != null ? `Refresh lagged: ${msg}` : msg,
      }));
    }
  }, [rivalry.slug]);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 15_000);
    return () => window.clearInterval(id);
  }, [load]);

  useEffect(() => {
    const id = window.setInterval(
      () => setNowSec(Math.floor(Date.now() / 1000)),
      1000,
    );
    return () => window.clearInterval(id);
  }, []);

  const themeVars = useMemo(
    () => rivalryCssVars(rivalry.colors),
    [rivalry.colors],
  );

  const windowMissing =
    !state.loading &&
    (state.windowStart == null ||
      state.windowEnd == null ||
      Boolean(state.error?.includes("not found")));
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
          windowEnd={state.windowEnd}
          loading={state.loading}
        />
        <BoardExplainer
          gateOpen={Boolean(gateOpen)}
          loading={state.loading}
          windowMissing={windowMissing}
          blinkPath={`/blink/${rivalry.slug}`}
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
