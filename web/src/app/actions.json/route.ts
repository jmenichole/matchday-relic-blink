import { ACTIONS_CORS_HEADERS } from "@solana/actions";

export async function GET(req: Request) {
  const origin = new URL(req.url).origin;
  const payload = {
    rules: [
      {
        pathPattern: "/**",
        apiPath: `${origin}/api/actions/declare`,
      },
    ],
  };

  return Response.json(payload, {
    headers: {
      ...ACTIONS_CORS_HEADERS,
      "Content-Type": "application/json",
    },
  });
}
