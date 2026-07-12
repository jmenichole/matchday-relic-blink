"use client";

import { useMemo, type ReactNode } from "react";
import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { RPC_URL } from "@/lib/program";

import "@solana/wallet-adapter-react-ui/styles.css";

/**
 * Empty `wallets` relies on Wallet Standard auto-detection so installed
 * wallets (Phantom, Solflare, Backpack, Glow, Coinbase, etc.) appear
 * without hardcoding a single adapter.
 */
export function WalletProviders({ children }: { children: ReactNode }) {
  const wallets = useMemo(() => [], []);

  return (
    <ConnectionProvider endpoint={RPC_URL}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>{children}</WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}
