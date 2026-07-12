# Matchday Relic Blink

Time-gated Solana passion stamps for the [DEV Weekend Challenge: Passion Edition](https://dev.to/events/challenges/weekend-2026-07-09).

**Passion is showing up while it counts.** During a live rivalry window, fans declare a side via Solana Action/Blink (or site wallet fallback) and earn an on-chain Matchday Relic (`has_relic` on an Allegiance PDA). After the window closes, Relics can no longer be claimed.

Prize track: **Best Use of Solana**.

## Stack

- Anchor program `matchday_relic` (devnet)
- Next.js board + `/api/actions/declare` Blink endpoint
- Wallet-adapter (Phantom) site fallback

Program id: `2Gyr5GPN7JZ3sdZCsXY3m8ZQ1roF5Qeb1Wfrak4wkA3X`

## Rivalries

| Slug | Sides |
|------|--------|
| `worldcup-arg-fra` | Argentina vs France |
| `fandom-nova-volt` | Crew Nova vs Crew Volt |

## Setup

### Program

```bash
# PATH: cargo, anchor, solana
solana config set --url https://api.devnet.solana.com
# Fund deployer wallet (faucet.solana.com) then:
anchor build
anchor deploy --provider.cluster devnet
npm install
npm run seed:rivalries
```

Deployer wallet used in this repo session: `8ePkMNR7KBr8F3vKgfoeVfkAbVQBK2a3s2PETYdFHyy9` (needs SOL — airdrop rate-limited during build).

### Web

```bash
cd web
npm install
# optional
# NEXT_PUBLIC_RPC_URL=...
# NEXT_PUBLIC_PROGRAM_ID=2Gyr5GPN7JZ3sdZCsXY3m8ZQ1roF5Qeb1Wfrak4wkA3X
# NEXT_PUBLIC_SITE_URL=https://your-deploy.example
npm run dev
```

Open `http://localhost:3000/r/worldcup-arg-fra`.

### Blink

Action URL:

`https://<SITE>/api/actions/declare?slug=worldcup-arg-fra`

Dialect:

`https://dial.to/?action=solana-action:https://<SITE>/api/actions/declare?slug=worldcup-arg-fra`

## Challenge notes

- Repository started within the challenge window (2026-07-12).
- Commits after the submission deadline (2026-07-13 06:59 UTC), if any, will be listed here:

_(none yet)_

## Docs

- Spec: `docs/superpowers/specs/2026-07-12-matchday-relic-blink-design.md`
- Plan: `docs/superpowers/plans/2026-07-12-matchday-relic-blink.md`
- DEV post draft: `SUBMISSION.md`
