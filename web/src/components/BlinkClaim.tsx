"use client";

import { useCallback, useMemo, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Transaction } from "@solana/web3.js";
import type { RivalryMeta } from "@/lib/rivalries";

type Props = {
  rivalry: RivalryMeta;
  actionUrl: string;
};

/**
 * In-app Blink: same Solana Action endpoint Dial.to would call, but signed
 * here with the connected wallet so we never depend on Dial.to's UI.
 */
export function BlinkClaim({ rivalry, actionUrl }: Props) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const sides = useMemo(
    () => [
      { side: 0 as const, label: rivalry.sideA },
      { side: 1 as const, label: rivalry.sideB },
    ],
    [rivalry.sideA, rivalry.sideB],
  );

  const runAction = useCallback(
    async (side: 0 | 1) => {
      if (!wallet.publicKey || !wallet.signTransaction) {
        setStatus("Connect a Solana wallet first (Devnet).");
        return;
      }

      setBusy(true);
      setStatus(null);
      try {
        const url = `${actionUrl}&side=${side}`;
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ account: wallet.publicKey.toBase58() }),
        });
        const json = (await res.json()) as {
          transaction?: string;
          message?: string;
        };
        if (!res.ok || !json.transaction) {
          throw new Error(json.message ?? `Action failed (${res.status})`);
        }

        const raw = Uint8Array.from(atob(json.transaction), (c) =>
          c.charCodeAt(0),
        );
        const tx = Transaction.from(raw);
        const signed = await wallet.signTransaction(tx);
        const sig = await connection.sendRawTransaction(signed.serialize(), {
          skipPreflight: false,
          preflightCommitment: "confirmed",
        });
        await connection.confirmTransaction(sig, "confirmed");
        setStatus(
          json.message
            ? `${json.message} Tx ${sig.slice(0, 8)}…`
            : `Relic stamped. Tx ${sig.slice(0, 8)}…`,
        );
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (/WindowClosed|0x1770|6000/i.test(msg)) {
          setStatus("Gate closed — Relics locked.");
        } else if (/User rejected|rejected the request|Cancellation/i.test(msg)) {
          setStatus("Signature cancelled.");
        } else {
          setStatus(msg);
        }
      } finally {
        setBusy(false);
      }
    },
    [actionUrl, connection, wallet],
  );

  const copyAction = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(actionUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setStatus("Could not copy — select the Action URL below.");
    }
  }, [actionUrl]);

  return (
    <section className="blink-panel">
      <h2 className="blink-panel-title">What is a Blink?</h2>
      <p className="blink-panel-body">
        A <strong>Blink</strong> is a Solana Action: a link that asks your
        wallet to sign one transaction. For Matchday Relic, that transaction
        is <em>declare</em> — pick a side while the gate is open and stamp your
        Relic on-chain.
      </p>
      <ol className="blink-steps">
        <li>Connect a wallet on <strong>Devnet</strong>.</li>
        <li>Tap Argentina or France (or Nova / Volt) below.</li>
        <li>Approve the declare transaction in your wallet.</li>
      </ol>
      <p className="blink-panel-note">
        Dial.to is optional for sharing. This page runs the same Action
        endpoint in-app so the claim path does not depend on Dial.to loading.
      </p>

      <div className="blink-wallet">
        <WalletMultiButton />
        <p className="wallet-install-hint">
          No wallets in the list? Install{" "}
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
          , set network to <strong>Devnet</strong>, refresh, then connect.
        </p>
      </div>

      <div className="blink-side-actions">
        {sides.map(({ side, label }) => (
          <button
            key={side}
            type="button"
            className={side === 0 ? "ticket-cta side-a-cta" : "ticket-cta side-b-cta"}
            disabled={busy || !wallet.publicKey}
            onClick={() => void runAction(side)}
          >
            {busy ? "Signing…" : `Blink: ${label}`}
          </button>
        ))}
      </div>

      {status ? <p className="status-line">{status}</p> : null}

      <div className="blink-share">
        <p className="blink-share-label">Shareable Action URL</p>
        <code className="blink-share-url">{actionUrl}</code>
        <button type="button" className="landing-secondary" onClick={() => void copyAction()}>
          {copied ? "Copied" : "Copy Action URL"}
        </button>
      </div>
    </section>
  );
}
