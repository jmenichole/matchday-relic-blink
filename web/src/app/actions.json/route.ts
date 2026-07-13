import { ACTIONS_CORS_HEADERS } from "@solana/actions";
import { RIVALRIES } from "@/lib/rivalries";

export async function GET() {
  const payload = {
    rules: [
      ...RIVALRIES.map((rivalry) => ({
        pathPattern: `/r/${rivalry.slug}`,
        apiPath: `/api/actions/declare?slug=${encodeURIComponent(rivalry.slug)}`,
      })),
      {
        pathPattern: "/**",
        apiPath: "/api/actions/declare?slug=worldcup-arg-fra",
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
