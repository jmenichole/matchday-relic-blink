export const RIVALRIES = [
  {
    slug: "worldcup-arg-fra",
    title: "World Cup Rivalry",
    sideA: "Argentina",
    sideB: "France",
  },
  {
    slug: "fandom-nova-volt",
    title: "Ship Wars",
    sideA: "Crew Nova",
    sideB: "Crew Volt",
  },
] as const;

export type RivalryMeta = (typeof RIVALRIES)[number];

export function getRivalry(slug: string): RivalryMeta | undefined {
  return RIVALRIES.find((r) => r.slug === slug);
}

export function padBytes(s: string, len: number): Buffer {
  const b = Buffer.alloc(len);
  Buffer.from(s).copy(b);
  return b;
}
