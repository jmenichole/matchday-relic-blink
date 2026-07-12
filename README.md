# Matchday Relic Blink

Time-gated Solana passion stamps for the [DEV Weekend Challenge: Passion Edition](https://dev.to/events/challenges/weekend-2026-07-09).

**Passion is showing up while it counts.** During a live rivalry window, fans declare a side via Solana Action/Blink (or site wallet fallback) and earn an on-chain Matchday Relic (`has_relic` on an Allegiance PDA). After the window closes, Relics can no longer be claimed.

Prize track: **Best Use of Solana**.

## Stack

- Anchor program `matchday_relic` (devnet)
- Next.js board + `/api/actions/declare` Blink endpoint
- Wallet-adapter (Phantom) site fallback

Program id: `2Gyr5GPN7JZ3sdZCsXY3m8ZQ1roF5Qeb1Wfrak4wkA3X` (live on **devnet**)

Seeded rivalry PDAs:

- `worldcup-arg-fra` → `62ojdgGKQWTZm8MtNJaTRa7H2ZSSySEhaE6dKUSv3ZBa`
- `fandom-nova-volt` → `5UjQA49aELXgsf5K844SXNBYpJK8nmZWgAAkffoQ149k`

Deployer: `8ePkMNR7KBr8F3vKgfoeVfkAbVQBK2a3s2PETYdFHyy9`

### Web (local run)

On Windows, `npm install` under paths with spaces (e.g. `...\hackathon projects\...`) can fail with `TAR_ENTRY_ERROR` / `EPERM`. Use a short path without spaces:

```powershell
# PATH tip (Solana / cargo tools)
$env:Path = "$env:USERPROFILE\.cargo\bin;$env:USERPROFILE\.local\bin;$env:USERPROFILE\.local\share\solana\install\active_release\bin;$env:Path"

# Copy web app to a short path (one-time / when deps change)
New-Item -ItemType Directory -Force -Path C:\dev\matchday-relic-blink | Out-Null
robocopy "C:\Users\jmeni\.cursor\hackathon projects\matchday-relic-blink\web" "C:\dev\matchday-relic-blink\web" /E /XD node_modules .next

cd C:\dev\matchday-relic-blink\web
npm install
# optional env
# $env:NEXT_PUBLIC_RPC_URL="https://api.devnet.solana.com"
# $env:NEXT_PUBLIC_PROGRAM_ID="2Gyr5GPN7JZ3sdZCsXY3m8ZQ1roF5Qeb1Wfrak4wkA3X"
# $env:NEXT_PUBLIC_SITE_URL="http://localhost:3000"
npm run build
npm run dev
```

Open `http://localhost:3000/r/worldcup-arg-fra`.

If your clone already lives on a path without spaces, a normal `cd web && npm install && npm run dev` is enough. Builds use webpack (`next build --webpack`) so Solana wallet polyfills and the empty `@solana-mobile/*` stubs resolve cleanly.

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