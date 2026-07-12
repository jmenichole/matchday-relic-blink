/**
 * Seed two rivalries on Matchday Relic (devnet by default).
 *
 * Usage:
 *   npx ts-node scripts/seed-rivalries.ts
 *
 * Env:
 *   ANCHOR_PROVIDER_URL  (default: https://api.devnet.solana.com)
 *   ANCHOR_WALLET        (default: ~/.config/solana/id.json)
 */
import * as anchor from "@coral-xyz/anchor";
import { Program, AnchorProvider, Wallet } from "@coral-xyz/anchor";
import { Connection, Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const PROGRAM_ID = new PublicKey("2Gyr5GPN7JZ3sdZCsXY3m8ZQ1roF5Qeb1Wfrak4wkA3X");
const RIVALRY_SEED = Buffer.from("rivalry");

type RivalrySpec = {
  id: string;
  sideA: string;
  sideB: string;
};

const RIVALRIES: RivalrySpec[] = [
  { id: "worldcup-arg-fra", sideA: "Argentina", sideB: "France" },
  { id: "fandom-nova-volt", sideA: "Crew Nova", sideB: "Crew Volt" },
];

function pad32(s: string): number[] {
  const out = new Array<number>(32).fill(0);
  const bytes = Buffer.from(s, "utf8");
  if (bytes.length > 32) {
    throw new Error(`string exceeds 32 bytes: ${s}`);
  }
  for (let i = 0; i < bytes.length; i++) out[i] = bytes[i];
  return out;
}

function loadWallet(): Keypair {
  const walletPath =
    process.env.ANCHOR_WALLET ||
    path.join(os.homedir(), ".config", "solana", "id.json");
  const raw = fs.readFileSync(walletPath, "utf8");
  const secret = Uint8Array.from(JSON.parse(raw));
  return Keypair.fromSecretKey(secret);
}

function loadIdl(): anchor.Idl {
  const idlPath = path.join(__dirname, "..", "target", "idl", "matchday_relic.json");
  return JSON.parse(fs.readFileSync(idlPath, "utf8")) as anchor.Idl;
}

async function main() {
  const rpcUrl = process.env.ANCHOR_PROVIDER_URL || "https://api.devnet.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");
  const payer = loadWallet();
  const wallet = new Wallet(payer);
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  anchor.setProvider(provider);

  const idl = loadIdl();
  const program = new Program(idl, provider);

  const now = Math.floor(Date.now() / 1000);
  const windowStart = now - 60;
  const windowEnd = now + 7 * 24 * 60 * 60;

  console.log(`RPC: ${rpcUrl}`);
  console.log(`Authority: ${payer.publicKey.toBase58()}`);
  console.log(`Program: ${PROGRAM_ID.toBase58()}`);
  console.log(`Window: ${windowStart} .. ${windowEnd}`);

  for (const spec of RIVALRIES) {
    const rivalryId = pad32(spec.id);
    const sideA = pad32(spec.sideA);
    const sideB = pad32(spec.sideB);
    const [rivalryPda] = PublicKey.findProgramAddressSync(
      [RIVALRY_SEED, Buffer.from(rivalryId)],
      PROGRAM_ID
    );

    const existing = await connection.getAccountInfo(rivalryPda);
    if (existing) {
      console.log(`SKIP ${spec.id} — already exists at ${rivalryPda.toBase58()}`);
      continue;
    }

    console.log(`Creating ${spec.id} (${spec.sideA} vs ${spec.sideB}) @ ${rivalryPda.toBase58()}...`);
    try {
      const tx = await program.methods
        .createRivalry(rivalryId, sideA, sideB, new anchor.BN(windowStart), new anchor.BN(windowEnd))
        .accounts({
          authority: payer.publicKey,
          rivalry: rivalryPda,
          systemProgram: SystemProgram.programId,
        })
        .rpc();
      console.log(`OK ${spec.id} tx=${tx}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes("already in use") || msg.includes("0x0")) {
        console.log(`SKIP ${spec.id} — account already in use (${msg})`);
        continue;
      }
      throw err;
    }
  }

  console.log("Seed complete.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
