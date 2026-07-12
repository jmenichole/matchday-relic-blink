# DEV Submission Draft — Matchday Relic Blink

**Tag:** `#weekendchallenge`  
**Challenge:** Weekend Challenge: Passion Edition  
**Category:** Best Use of Solana (eligible)

## Title

Matchday Relic Blink — passion is showing up while it counts

## Overview

I built **Matchday Relic**, a Solana Action/Blink + board where fans declare for a rivalry *during a live window* and stamp an on-chain Relic. After the whistle, that stamp can no longer be earned. Same mechanic for a World Cup rivalry (Argentina vs France) and a fandom war (Crew Nova vs Crew Volt).

## What inspired it

Passion isn’t a vibe check — it’s whether you showed up. With the World Cup energy everywhere, I wanted a tiny on-chain ritual: public allegiance that only counts if you claim it in time.

## How it works

1. Authority seeds a **Rivalry** PDA with `window_start` / `window_end` and two sides.
2. Fan hits a **Blink** (or site wallet claim) and signs `declare`.
3. Program checks Solana `Clock` is inside the window; otherwise `WindowClosed`.
4. **Allegiance** PDA stores side, motto, `declared_at`, and `has_relic = true`; tallies update.
5. Board shows a ticket-stub claim CTA + versus Relic counts.

## Demo

- Live site: https://matchday-relic-blink.vercel.app
- Board: https://matchday-relic-blink.vercel.app/r/worldcup-arg-fra and https://matchday-relic-blink.vercel.app/r/fandom-nova-volt
- Action: `solana-action:https://matchday-relic-blink.vercel.app/api/actions/declare?slug=worldcup-arg-fra`
- Dialect: `https://dial.to/?action=solana-action%3Ahttps%3A%2F%2Fmatchday-relic-blink.vercel.app%2Fapi%2Factions%2Fdeclare%3Fslug%3Dworldcup-arg-fra`
- Script: open board → Claim Relic (in-app wallet) → pick side → sign → tallies bump; optional Open Blink; closed window shows gate locked

## Repo

GitHub: https://github.com/jmenichole/matchday-relic-blink

Program id (devnet): `2Gyr5GPN7JZ3sdZCsXY3m8ZQ1roF5Qeb1Wfrak4wkA3X`

## Stack

Anchor · Solana Actions/Blinks · Next.js · Wallet Standard (multi-wallet) · Devnet

## Stretch (not required for v1)

Real Metaplex/Core NFT Relic art instead of the PDA stamp badge.
