export function padBytes(s: string, len: number): number[] {
  const out = new Array<number>(len).fill(0);
  const encoded = new TextEncoder().encode(s);
  for (let i = 0; i < Math.min(encoded.length, len); i++) {
    out[i] = encoded[i];
  }
  return out;
}

export function bytesToString(bytes: number[] | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  const end = arr.findIndex((b) => b === 0);
  const slice = end === -1 ? arr : arr.slice(0, end);
  return new TextDecoder().decode(slice);
}
