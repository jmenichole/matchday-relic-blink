export type RivalryColors = {
  sideA: string;
  sideASoft: string;
  sideB: string;
  sideBSoft: string;
  accent: string;
  glowA: string;
  glowB: string;
  ticketSplit: string;
  ctaFrom: string;
  ctaTo: string;
  ctaText: string;
};

export type RivalryMeta = {
  slug: string;
  title: string;
  sideA: string;
  sideB: string;
  colors: RivalryColors;
};

export const RIVALRIES: readonly RivalryMeta[] = [
  {
    slug: "worldcup-arg-fra",
    title: "World Cup Rivalry",
    sideA: "Argentina",
    sideB: "France",
    colors: {
      // Argentina celeste + white; France blue / white / red accents
      sideA: "#74ACDF",
      sideASoft: "rgba(116, 172, 223, 0.22)",
      sideB: "#7BA3FF",
      sideBSoft: "rgba(0, 35, 149, 0.35)",
      accent: "#ED2939",
      glowA: "rgba(116, 172, 223, 0.28)",
      glowB: "rgba(237, 41, 57, 0.18)",
      ticketSplit:
        "linear-gradient(105deg, rgba(116, 172, 223, 0.28) 0%, rgba(255, 255, 255, 0.08) 46%, rgba(0, 35, 149, 0.32) 100%)",
      ctaFrom: "#74ACDF",
      ctaTo: "#4f8fc7",
      ctaText: "#0a1620",
    },
  },
  {
    slug: "fandom-nova-volt",
    title: "Ship Wars",
    sideA: "Crew Nova",
    sideB: "Crew Volt",
    colors: {
      // Nova cyan/magenta; Volt amber/gold vs deep violet
      sideA: "#22D3EE",
      sideASoft: "rgba(34, 211, 238, 0.2)",
      sideB: "#FBBF24",
      sideBSoft: "rgba(245, 158, 11, 0.22)",
      accent: "#E879F9",
      glowA: "rgba(34, 211, 238, 0.26)",
      glowB: "rgba(124, 58, 237, 0.28)",
      ticketSplit:
        "linear-gradient(105deg, rgba(34, 211, 238, 0.26) 0%, rgba(232, 121, 249, 0.16) 48%, rgba(91, 33, 182, 0.38) 100%)",
      ctaFrom: "#F59E0B",
      ctaTo: "#D97706",
      ctaText: "#1a1004",
    },
  },
] as const;

export function getRivalry(slug: string): RivalryMeta | undefined {
  return RIVALRIES.find((r) => r.slug === slug);
}

/** CSS custom properties for a rivalry board theme. */
export function rivalryCssVars(
  colors: RivalryColors,
): Record<string, string> {
  return {
    "--side-a": colors.sideA,
    "--side-a-soft": colors.sideASoft,
    "--side-b": colors.sideB,
    "--side-b-soft": colors.sideBSoft,
    "--accent": colors.accent,
    "--glow-a": colors.glowA,
    "--glow-b": colors.glowB,
    "--ticket-split": colors.ticketSplit,
    "--cta-from": colors.ctaFrom,
    "--cta-to": colors.ctaTo,
    "--cta-text": colors.ctaText,
  };
}

/** Dialect / dial.to Blink URL with nested Action query fully encoded. */
export function dialectBlinkUrl(actionUrl: string): string {
  return `https://dial.to/?action=${encodeURIComponent(
    `solana-action:${actionUrl}`,
  )}`;
}
