"use client";

import { useCallback, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { SystemProgram } from "@solana/web3.js";
import { padBytes } from "@/lib/bytes";
import {
  allegiancePda,
  getProgram,
  rivalryPda,
} from "@/lib/program";

type Props = {
  slug: string;
  sideA: string;
  sideB: string;
  gateOpen: boolean;
  onDeclared?: () => void;
};

export function WalletDeclare({
  slug,
  sideA,
  sideB,
  gateOpen,
  onDeclared,
}: Props) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [side, setSide] = useState<0 | 1>(0);
  const [motto, setMotto] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const declare = useCallback(async () => {
    if (!wallet.publicKey || !wallet.signTransaction) {
      setStatus("Connect a wallet first.");
      return;
    }
    if (!gateOpen) {
      setStatus("Gate closed - Relics locked");
      return;
    }

    setBusy(true);
    setStatus(null);
    try {
      const program = getProgram(connection, wallet as never);
      const rivalry = rivalryPda(slug);
      const allegiance = allegiancePda(rivalry, wallet.publicKey);
      const mottoBytes = padBytes(motto.slice(0, 64), 64);

      const sig = await program.methods
        .declare(side, mottoBytes)
        .accounts({
          fan: wallet.publicKey,
          rivalry,
          allegiance,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setStatus(`Relic stamped on-chain. ${sig.slice(0, 8)}...`);
      onDeclared?.();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/WindowClosed|6000|custom program error: 0x1770/i.test(msg)) {
        setStatus("Gate closed - Relics locked");
      } else if (/already in use|0x0/i.test(msg)) {
        setStatus("Allegiance account conflict - refresh and try again.");
      } else if (/User rejected|rejected the request|Cancellation/i.test(msg)) {
        setStatus("Signature cancelled.");
      } else {
        setStatus(msg);
      }
    } finally {
      setBusy(false);
    }
  }, [
    connection,
    gateOpen,
    motto,
    onDeclared,
    side,
    slug,
    wallet,
  ]);

  return (
    <section id="claim" className="wallet-fallback">
      <h3>Claim Relic with wallet</h3>
      <p>
        Primary path: pick a side, connect any Solana wallet on Devnet, and
        stamp your Relic here.
      </p>
      <WalletMultiButton />
      <p className="wallet-install-hint">
        Need a wallet? Install{" "}
        <a
          href="https://phantom.app/download"
          target="_blank"
          rel="noreferrer"
        >
          Phantom
        </a>{" "}
        or{" "}
        <a
          href="https://solflare.com/download"
          target="_blank"
          rel="noreferrer"
        >
          Solflare
        </a>
        , switch the network to <strong>Devnet</strong>, then tap Select Wallet
        again.
      </p>
      <div className="side-picker">
        <button
          type="button"
          className={`side-a${side === 0 ? " active" : ""}`}
          onClick={() => setSide(0)}
        >
          {sideA}
        </button>
        <button
          type="button"
          className={`side-b${side === 1 ? " active" : ""}`}
          onClick={() => setSide(1)}
        >
          {sideB}
        </button>
      </div>
      <input
        className="motto-input"
        maxLength={64}
        placeholder="Optional motto"
        value={motto}
        onChange={(e) => setMotto(e.target.value)}
      />
      <button
        type="button"
        className="ticket-cta"
        disabled={busy || !gateOpen || !wallet.publicKey}
        onClick={() => void declare()}
      >
        {busy ? "Signing." : "Declare & stamp"}
      </button>
      {status ? <p className="status-line">{status}</p> : null}
    </section>
  );
}
