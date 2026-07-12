import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Idl, Program } from "@coral-xyz/anchor";
import idl from "@/idl/matchday_relic.json";
import { padBytes } from "@/lib/bytes";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ??
    "2Gyr5GPN7JZ3sdZCsXY3m8ZQ1roF5Qeb1Wfrak4wkA3X",
);

export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";

export type RivalryAccount = {
  authority: PublicKey;
  rivalryId: number[];
  sideA: number[];
  sideB: number[];
  windowStart: { toNumber: () => number };
  windowEnd: { toNumber: () => number };
  countA: number;
  countB: number;
  bump: number;
};

const enc = new TextEncoder();

export function rivalryPda(slug: string): PublicKey {
  const id = Uint8Array.from(padBytes(slug, 32));
  return PublicKey.findProgramAddressSync(
    [enc.encode("rivalry"), id],
    PROGRAM_ID,
  )[0];
}

export function allegiancePda(rivalry: PublicKey, fan: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [enc.encode("allegiance"), rivalry.toBytes(), fan.toBytes()],
    PROGRAM_ID,
  )[0];
}

export function getConnection(): Connection {
  return new Connection(RPC_URL, "confirmed");
}

export function getReadOnlyProgram(connection: Connection = getConnection()) {
  const wallet = {
    publicKey: PublicKey.default,
    signTransaction: async () => {
      throw new Error("read-only wallet");
    },
    signAllTransactions: async () => {
      throw new Error("read-only wallet");
    },
  };
  const provider = new AnchorProvider(connection, wallet as never, {
    commitment: "confirmed",
  });
  return new Program(idl as Idl, provider);
}

export function getProgram(
  connection: Connection,
  wallet: AnchorProvider["wallet"],
) {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  return new Program(idl as Idl, provider);
}

export type FetchedRivalry = {
  countA: number;
  countB: number;
  windowStart: number;
  windowEnd: number;
};

export async function fetchRivalryAccount(
  connection: Connection,
  pda: PublicKey,
): Promise<FetchedRivalry | null> {
  const program = getReadOnlyProgram(connection);
  const account = (await program.account.rivalry.fetchNullable(pda)) as
    | RivalryAccount
    | null;
  if (!account) return null;
  return {
    countA: account.countA,
    countB: account.countB,
    windowStart: account.windowStart.toNumber(),
    windowEnd: account.windowEnd.toNumber(),
  };
}
