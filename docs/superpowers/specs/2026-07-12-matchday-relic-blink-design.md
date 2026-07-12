# Matchday Relic Blink — Design Spec

**Date:** 2026-07-12  
**Challenge:** DEV Weekend Challenge — Passion Edition  
**Prize track:** Best Use of Solana  
**Status:** Draft for user review

## Problem

Passion is showing up while it counts. Fans declare allegiance during a live window and earn an on-chain Matchday Relic stamp; after the whistle, that stamp can no longer be earned.

## Product summary

A Solana Action/Blink plus a web board where a fan:

1. Sees a rivalry with an open time window
2. Claims a Matchday Relic via Blink (or site wallet fallback)
3. Gets an Allegiance PDA with `has_relic = true` and updates side tallies
4. Cannot earn the Relic after `window_end`

Content pack: one sports rivalry and one fandom rivalry, same mechanics.

## Architecture

```
Fan → Next.js (board UI + Actions/Blinks API)
         → Anchor program (devnet)
              → Rivalry PDA (window + counts)
              → Allegiance PDA (side + motto + relic flag)
```

| Unit | Responsibility | Depends on |
|------|----------------|------------|
| Anchor program | Time-gated `declare`, rivalry seeding, counters | Solana Clock, PDAs |
| Actions API routes | Blink metadata + transaction build for `declare` | Program IDL, RPC |
| Board UI | Ticket-stub claim CTA + versus tallies | RPC reads, wallet adapter |
| Seed config | Sports + fandom rivalry labels and windows | Authority keypair |

## On-chain model

### Rivalry PDA

Seeds: `["rivalry", rivalry_id]`

| Field | Type | Notes |
|-------|------|--------|
| authority | Pubkey | Can create/seed |
| side_a / side_b | [u8; 32] | UTF-8 labels, zero-padded |
| window_start / window_end | i64 | Unix timestamps; inclusive range |
| count_a / count_b | u32 | Allegiance tallies |
| bump | u8 | |

`rivalry_id` seed: fixed `[u8; 32]` slug (e.g. `"worldcup-arg-fra"` padded).

### Allegiance PDA

Seeds: `["allegiance", rivalry, fan]`

| Field | Type | Notes |
|-------|------|--------|
| fan | Pubkey | Signer |
| rivalry | Pubkey | Rivalry account |
| side | u8 | 0 = A, 1 = B |
| motto | [u8; 64] | Optional UTF-8, padded |
| declared_at | i64 | Clock timestamp |
| has_relic | bool | Always true after successful declare |
| bump | u8 | |

One allegiance per fan per rivalry. Re-declare inside the window updates side/motto; Relic stays true. Side switches adjust `count_a` / `count_b`.

### Instructions

1. **`create_rivalry`** — authority creates rivalry + window (demo seeds sports + fandom).
2. **`declare`** — fan picks side (+ optional motto); requires `Clock` in `[window_start, window_end]`; sets `has_relic = true`; updates counts.

Stretch only: `close_window` for early freeze.

### Errors

- `WindowClosed` — clock outside `[window_start, window_end]`
- `InvalidSide`
- `MottoTooLong`

### Relic rule (v1)

Relic = `has_relic` on Allegiance plus board badge. No Bubblegum/cNFT mint in v1. Stretch: Metaplex/Core NFT art if core path ships early.

## UX

### Board layout (hybrid)

1. **Hero — ticket stub:** rivalry title, sides, window countdown, primary CTA **CLAIM MATCHDAY RELIC** (opens Blink).
2. **Versus split:** side A vs side B relic counts.
3. **Fallback:** connect wallet + declare on-site if Blink unavailable.
4. **Closed state:** CTA disabled or Blink returns clear window-closed message; tallies remain readable.

### Seeded rivalries

- Sports: **Argentina** vs **France** (`worldcup-arg-fra`)
- Fandom: **Crew Nova** vs **Crew Volt** (`fandom-nova-volt`)

Same layout for both; switch via route or selector. Demo window: authority sets `window_end` far enough past submission for judges (e.g. +7 days), with a second rivalry or scripted clip for the closed-window demo.

## Demo script (≈60s)

1. Board shows OPEN + countdown  
2. Claim → Blink / wallet signs `declare`  
3. Tallies update; Relic holder row appears  
4. Clip 2: after window end, claim fails with window closed  

## Submission

- New repo started in challenge window  
- Devnet deploy + README (note any post-deadline commits)  
- DEV post: hook, build, time-gate explanation, demo, repo, Blink URL, `#weekendchallenge`  
- English post for prize eligibility  

## Success criteria

- [ ] Devnet program deployed with ≥1 rivalry and open window for judges  
- [ ] Blink and/or site path completes a successful `declare`  
- [ ] Board shows hybrid layout and live tallies  
- [ ] README + DEV submission post published before deadline  

## Out of scope

Betting/gambling, mainnet, Bubblegum pipeline, chat, Snowflake, ElevenLabs, Google AI (unless leftover time after core).

## Stack

- Anchor (Rust) on Solana **devnet**
- Next.js (App Router) — board + `/api/actions/...` Blink routes
- Solana wallet adapter
- Config-driven rivalry seeds

## Error handling (app layer)

- RPC failures: toast + retry  
- User rejects tx: non-blocking message  
- Outside window: explicit copy (“Gate closed — Relics locked”)  
- Blink CORS/headers: follow Solana Actions spec; demo video as backup proof  

## Testing (minimum)

- Unit/program tests: declare inside window succeeds; outside fails; counts update on first declare and side switch  
- Manual: Blink claim on board rivalry; closed-window path  

## Non-goals for polish

Pixel-perfect branding systems; multi-language UI; mobile-native apps.
