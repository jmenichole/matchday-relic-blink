import {
  ACTIONS_CORS_HEADERS,
  ActionGetResponse,
  ActionPostRequest,
  ActionPostResponse,
  createPostResponse,
} from "@solana/actions";
import {
  Connection,
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import { Program, AnchorProvider, Idl } from "@coral-xyz/anchor";
import idl from "@/idl/matchday_relic.json";
import { getRivalry } from "@/lib/rivalries";
import { padBytes } from "@/lib/bytes";
import { RPC_URL, allegiancePda, rivalryPda } from "@/lib/program";

export const runtime = "nodejs";

function actionHeaders() {
  return ACTIONS_CORS_HEADERS;
}

function readOnlyProgram(connection: Connection) {
  const wallet = {
    publicKey: PublicKey.default,
    signTransaction: async () => {
      throw new Error("read-only");
    },
    signAllTransactions: async () => {
      throw new Error("read-only");
    },
  };
  const provider = new AnchorProvider(connection, wallet as never, {
    commitment: "confirmed",
  });
  return new Program(idl as Idl, provider);
}

export async function OPTIONS() {
  return new Response(null, { headers: actionHeaders() });
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug") ?? "worldcup-arg-fra";
  const rivalry = getRivalry(slug);

  if (!rivalry) {
    return Response.json(
      { message: "Unknown rivalry" },
      { status: 404, headers: actionHeaders() },
    );
  }

  const baseHref = `${url.origin}/api/actions/declare?slug=${encodeURIComponent(slug)}`;
  const payload: ActionGetResponse = {
    type: "action",
    icon: new URL("/relic-icon.svg", url.origin).toString(),
    title: `Claim Relic · ${rivalry.title}`,
    description: `Declare for ${rivalry.sideA} or ${rivalry.sideB} during the live window and stamp your Matchday Relic on Solana.`,
    label: "Claim Matchday Relic",
    links: {
      actions: [
        {
          type: "transaction",
          label: rivalry.sideA,
          href: `${baseHref}&side=0`,
        },
        {
          type: "transaction",
          label: rivalry.sideB,
          href: `${baseHref}&side=1`,
        },
      ],
    },
  };

  return Response.json(payload, { headers: actionHeaders() });
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const slug = url.searchParams.get("slug") ?? "worldcup-arg-fra";
    const sideParam = Number(url.searchParams.get("side") ?? "0");
    const side = sideParam === 1 ? 1 : 0;
    const rivalry = getRivalry(slug);

    if (!rivalry) {
      return Response.json(
        { message: "Unknown rivalry" },
        { status: 404, headers: actionHeaders() },
      );
    }

    const body = (await req.json()) as ActionPostRequest;
    const fan = new PublicKey(body.account);
    const connection = new Connection(RPC_URL, "confirmed");
    const program = readOnlyProgram(connection);
    const rivalryKey = rivalryPda(slug);
    const allegiance = allegiancePda(rivalryKey, fan);
    const motto = padBytes("", 64);

    const ix: TransactionInstruction = await program.methods
      .declare(side, motto)
      .accounts({
        fan,
        rivalry: rivalryKey,
        allegiance,
      })
      .instruction();

    const { blockhash } = await connection.getLatestBlockhash("confirmed");

    const message = new TransactionMessage({
      payerKey: fan,
      recentBlockhash: blockhash,
      instructions: [ix],
    }).compileToV0Message();

    const tx = new VersionedTransaction(message);

    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        type: "transaction",
        transaction: tx,
        message: `Declared for ${side === 0 ? rivalry.sideA : rivalry.sideB}. Relic stamped if the gate is open.`,
      },
    });

    return Response.json(payload, { headers: actionHeaders() });
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "Failed to build declare tx";
    return Response.json(
      { message },
      { status: 500, headers: actionHeaders() },
    );
  }
}
