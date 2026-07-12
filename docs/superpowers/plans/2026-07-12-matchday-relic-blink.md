# Matchday Relic Blink Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship a Solana devnet dapp where fans claim a time-gated Matchday Relic via Blink (and site fallback), with a hybrid ticket-stub + versus board, ready for the DEV `#weekendchallenge` submission.

**Architecture:** Anchor program owns Rivalry + Allegiance PDAs and enforces the match window on `declare`. A Next.js app serves the hybrid board UI, Solana Actions/Blinks routes that build `declare` transactions, and a wallet-adapter fallback. Authority seeds two rivalries (sports + fandom) on devnet.

**Tech Stack:** Anchor (Rust), Solana devnet, Next.js App Router, `@solana/actions` + `@solana/web3.js` at Blink boundary, `@coral-xyz/anchor` + wallet-adapter for site declare, TypeScript tests via Anchor/bankrun or `anchor test`.

**Spec:** `docs/superpowers/specs/2026-07-12-matchday-relic-blink-design.md`

---

## File map

| Path | Responsibility |
|------|----------------|
| `Anchor.toml` | Workspace + cluster config |
| `programs/matchday_relic/src/lib.rs` | Program: accounts, `create_rivalry`, `declare`, errors |
| `programs/matchday_relic/Cargo.toml` | Program crate |
| `tests/matchday_relic.ts` | Integration tests for window + counts |
| `scripts/seed-rivalries.ts` | Create both rivalries on target cluster |
| `web/package.json` | Next.js app deps |
| `web/src/lib/program.ts` | IDL client helpers, PDA derivations |
| `web/src/lib/rivalries.ts` | Static rivalry metadata (slugs, labels) |
| `web/src/app/page.tsx` | Home: rivalry picker |
| `web/src/app/r/[slug]/page.tsx` | Hybrid board (ticket + versus) |
| `web/src/components/TicketStub.tsx` | Countdown + CLAIM CTA |
| `web/src/components/VersusBoard.tsx` | Side tallies |
| `web/src/components/WalletDeclare.tsx` | Connect-wallet fallback declare |
| `web/src/app/api/actions/declare/route.ts` | GET/POST Solana Action for declare |
| `web/src/app/actions.json/route.ts` | Actions registry (optional Dialect discovery) |
| `README.md` | Runbook, challenge notes, Blink URL |
| `SUBMISSION.md` | DEV post draft |

---

### Task 1: Bootstrap Anchor + git repo

**Files:**
- Create: `Anchor.toml`, `Cargo.toml` (workspace), `programs/matchday_relic/*`, `.gitignore`
- Keep existing: `docs/superpowers/specs/2026-07-12-matchday-relic-blink-design.md`

- [ ] **Step 1: Create project root and init git if missing**

Run from `C:\Users\jmeni\.cursor\hackathon projects` (or move agent into `matchday-relic-blink` via create_project first):

```bash
# If using a dedicated folder:
# create_project → matchday-relic-blink, then move_agent_to_root
cd "C:/Users/jmeni/.cursor/hackathon projects"
```

Prefer dedicated folder `matchday-relic-blink` with docs copied in. Ensure `.gitignore` includes:

```
.superpowers/
node_modules/
.anchor/
target/
web/.next/
.env*
**/keypair.json
```

- [ ] **Step 2: Scaffold Anchor program**

```bash
NO_DNA=1 avm use latest
anchor --version
anchor init matchday_relic --no-git
# If init created nested folder, flatten so Anchor.toml is at repo root
```

Rename program to `matchday_relic` if needed. Confirm `programs/matchday_relic/src/lib.rs` exists.

- [ ] **Step 3: Commit scaffold**

```bash
git add Anchor.toml Cargo.toml programs packages.json tsconfig.json tests .gitignore
git commit -m "chore: scaffold Anchor workspace for matchday_relic"
```

---

### Task 2: Program state + errors (compile-only)

**Files:**
- Modify: `programs/matchday_relic/src/lib.rs`

- [ ] **Step 1: Replace `lib.rs` with accounts and errors (no instruction bodies yet beyond stubs)**

```rust
use anchor_lang::prelude::*;

declare_id!("ReplaceWithKeygenPubkey11111111111111111111111");

pub const RIVALRY_ID_LEN: usize = 32;
pub const LABEL_LEN: usize = 32;
pub const MOTTO_LEN: usize = 64;

#[program]
pub mod matchday_relic {
    use super::*;

    pub fn create_rivalry(
        ctx: Context<CreateRivalry>,
        rivalry_id: [u8; RIVALRY_ID_LEN],
        side_a: [u8; LABEL_LEN],
        side_b: [u8; LABEL_LEN],
        window_start: i64,
        window_end: i64,
    ) -> Result<()> {
        require!(window_end > window_start, MatchdayError::InvalidWindow);
        let rivalry = &mut ctx.accounts.rivalry;
        rivalry.authority = ctx.accounts.authority.key();
        rivalry.rivalry_id = rivalry_id;
        rivalry.side_a = side_a;
        rivalry.side_b = side_b;
        rivalry.window_start = window_start;
        rivalry.window_end = window_end;
        rivalry.count_a = 0;
        rivalry.count_b = 0;
        rivalry.bump = ctx.bumps.rivalry;
        Ok(())
    }

    pub fn declare(
        ctx: Context<Declare>,
        side: u8,
        motto: [u8; MOTTO_LEN],
    ) -> Result<()> {
        require!(side == 0 || side == 1, MatchdayError::InvalidSide);
        let clock = Clock::get()?;
        let rivalry = &mut ctx.accounts.rivalry;
        require!(
            clock.unix_timestamp >= rivalry.window_start
                && clock.unix_timestamp <= rivalry.window_end,
            MatchdayError::WindowClosed
        );

        let allegiance = &mut ctx.accounts.allegiance;
        let is_new = allegiance.fan == Pubkey::default();

        if is_new {
            allegiance.fan = ctx.accounts.fan.key();
            allegiance.rivalry = rivalry.key();
            allegiance.bump = ctx.bumps.allegiance;
            if side == 0 {
                rivalry.count_a = rivalry.count_a.checked_add(1).unwrap();
            } else {
                rivalry.count_b = rivalry.count_b.checked_add(1).unwrap();
            }
        } else if allegiance.side != side {
            if side == 0 {
                rivalry.count_b = rivalry.count_b.saturating_sub(1);
                rivalry.count_a = rivalry.count_a.checked_add(1).unwrap();
            } else {
                rivalry.count_a = rivalry.count_a.saturating_sub(1);
                rivalry.count_b = rivalry.count_b.checked_add(1).unwrap();
            }
        }

        allegiance.side = side;
        allegiance.motto = motto;
        allegiance.declared_at = clock.unix_timestamp;
        allegiance.has_relic = true;
        Ok(())
    }
}

#[derive(Accounts)]
#[instruction(rivalry_id: [u8; RIVALRY_ID_LEN])]
pub struct CreateRivalry<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + Rivalry::INIT_SPACE,
        seeds = [b"rivalry", rivalry_id.as_ref()],
        bump
    )]
    pub rivalry: Account<'info, Rivalry>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct Declare<'info> {
    #[account(mut)]
    pub fan: Signer<'info>,
    #[account(
        mut,
        seeds = [b"rivalry", rivalry.rivalry_id.as_ref()],
        bump = rivalry.bump
    )]
    pub rivalry: Account<'info, Rivalry>,
    #[account(
        init_if_needed,
        payer = fan,
        space = 8 + Allegiance::INIT_SPACE,
        seeds = [b"allegiance", rivalry.key().as_ref(), fan.key().as_ref()],
        bump
    )]
    pub allegiance: Account<'info, Allegiance>,
    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Rivalry {
    pub authority: Pubkey,
    pub rivalry_id: [u8; RIVALRY_ID_LEN],
    pub side_a: [u8; LABEL_LEN],
    pub side_b: [u8; LABEL_LEN],
    pub window_start: i64,
    pub window_end: i64,
    pub count_a: u32,
    pub count_b: u32,
    pub bump: u8,
}

#[account]
#[derive(InitSpace)]
pub struct Allegiance {
    pub fan: Pubkey,
    pub rivalry: Pubkey,
    pub side: u8,
    pub motto: [u8; MOTTO_LEN],
    pub declared_at: i64,
    pub has_relic: bool,
    pub bump: u8,
}

#[error_code]
pub enum MatchdayError {
    #[msg("Match window is closed")]
    WindowClosed,
    #[msg("Side must be 0 or 1")]
    InvalidSide,
    #[msg("Motto exceeds max length")]
    MottoTooLong,
    #[msg("window_end must be after window_start")]
    InvalidWindow,
}
```

Note: enable `init-if-needed` in `Cargo.toml`:

```toml
[dependencies]
anchor-lang = { version = "0.30.1", features = ["init-if-needed"] }
```

(Use the Anchor version from `anchor --version`; align crate version.)

- [ ] **Step 2: Build**

```bash
anchor build
```

Expected: success; copy program id into `declare_id!` and `Anchor.toml`.

```bash
anchor keys sync
anchor build
```

- [ ] **Step 3: Commit**

```bash
git add programs/matchday_relic Anchor.toml Cargo.lock
git commit -m "feat: add Rivalry and Allegiance accounts with create_rivalry and declare"
```

---

### Task 3: Failing tests then green for window + counts

**Files:**
- Create/Modify: `tests/matchday_relic.ts`

- [ ] **Step 1: Write tests**

```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MatchdayRelic } from "../target/types/matchday_relic";
import { expect } from "chai";

function pad32(s: string): number[] {
  const b = Buffer.alloc(32);
  Buffer.from(s).copy(b);
  return [...b];
}

function pad64(s: string): number[] {
  const b = Buffer.alloc(64);
  Buffer.from(s).copy(b);
  return [...b];
}

describe("matchday_relic", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = anchor.workspace.MatchdayRelic as Program<MatchdayRelic>;

  it("declare inside window sets relic and increments count", async () => {
    const rivalryId = pad32("worldcup-arg-fra");
    const now = Math.floor(Date.now() / 1000);
    const [rivalryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("rivalry"), Buffer.from(rivalryId)],
      program.programId
    );

    await program.methods
      .createRivalry(
        rivalryId,
        pad32("Argentina"),
        pad32("France"),
        new anchor.BN(now - 60),
        new anchor.BN(now + 3600)
      )
      .accounts({
        authority: provider.wallet.publicKey,
        rivalry: rivalryPda,
      })
      .rpc();

    const [allegiancePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("allegiance"),
        rivalryPda.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );

    await program.methods
      .declare(0, pad64("vamos"))
      .accounts({
        fan: provider.wallet.publicKey,
        rivalry: rivalryPda,
        allegiance: allegiancePda,
      })
      .rpc();

    const rivalry = await program.account.rivalry.fetch(rivalryPda);
    const allegiance = await program.account.allegiance.fetch(allegiancePda);
    expect(rivalry.countA).to.equal(1);
    expect(allegiance.hasRelic).to.equal(true);
    expect(allegiance.side).to.equal(0);
  });

  it("declare outside window fails with WindowClosed", async () => {
    const rivalryId = pad32("closed-window-test");
    const now = Math.floor(Date.now() / 1000);
    const [rivalryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("rivalry"), Buffer.from(rivalryId)],
      program.programId
    );

    await program.methods
      .createRivalry(
        rivalryId,
        pad32("Crew Nova"),
        pad32("Crew Volt"),
        new anchor.BN(now - 7200),
        new anchor.BN(now - 3600)
      )
      .accounts({
        authority: provider.wallet.publicKey,
        rivalry: rivalryPda,
      })
      .rpc();

    const [allegiancePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [
        Buffer.from("allegiance"),
        rivalryPda.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );

    try {
      await program.methods
        .declare(1, pad64(""))
        .accounts({
          fan: provider.wallet.publicKey,
          rivalry: rivalryPda,
          allegiance: allegiancePda,
        })
        .rpc();
      expect.fail("should have thrown");
    } catch (e: any) {
      expect(e.error?.errorCode?.code || e.message).to.match(/WindowClosed|6000|custom program error/i);
    }
  });
});
```

- [ ] **Step 2: Run tests**

```bash
anchor test
```

Expected: both tests PASS.

- [ ] **Step 3: Commit**

```bash
git add tests/matchday_relic.ts
git commit -m "test: cover declare inside window and WindowClosed"
```

---

### Task 4: Deploy to devnet + seed rivalries

**Files:**
- Create: `scripts/seed-rivalries.ts`
- Modify: `Anchor.toml` (`[provider] cluster = "devnet"`)

- [ ] **Step 1: Configure wallet + airdrop**

```bash
solana config set --url https://api.devnet.solana.com
solana airdrop 2
anchor deploy --provider.cluster devnet
```

Record program id; ensure `declare_id!` matches.

- [ ] **Step 2: Seed script**

```typescript
// scripts/seed-rivalries.ts
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { MatchdayRelic } from "../target/types/matchday_relic";
import idl from "../target/idl/matchday_relic.json";

function pad32(s: string): number[] {
  const b = Buffer.alloc(32);
  Buffer.from(s).copy(b);
  return [...b];
}

async function main() {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  const program = new Program(idl as anchor.Idl, provider) as Program<MatchdayRelic>;
  const now = Math.floor(Date.now() / 1000);
  const windowEnd = now + 7 * 24 * 3600;

  const seeds = [
    { id: "worldcup-arg-fra", a: "Argentina", b: "France" },
    { id: "fandom-nova-volt", a: "Crew Nova", b: "Crew Volt" },
  ];

  for (const s of seeds) {
    const rivalryId = pad32(s.id);
    const [rivalryPda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("rivalry"), Buffer.from(rivalryId)],
      program.programId
    );
    try {
      await program.methods
        .createRivalry(rivalryId, pad32(s.a), pad32(s.b), new anchor.BN(now - 60), new anchor.BN(windowEnd))
        .accounts({ authority: provider.wallet.publicKey, rivalry: rivalryPda })
        .rpc();
      console.log("created", s.id, rivalryPda.toBase58());
    } catch (e) {
      console.log("skip/exists", s.id, e);
    }
  }
}

main();
```

Run:

```bash
ANCHOR_PROVIDER_URL=https://api.devnet.solana.com ANCHOR_WALLET=~/.config/solana/id.json npx ts-node scripts/seed-rivalries.ts
```

- [ ] **Step 3: Commit deploy artifacts needed by web (IDL + types), not keypairs**

```bash
git add target/idl/matchday_relic.json target/types/matchday_relic.ts scripts/seed-rivalries.ts Anchor.toml
git commit -m "chore: deploy prep and seed script for sports + fandom rivalries"
```

---

### Task 5: Next.js web app shell + rivalry config

**Files:**
- Create: `web/` Next.js app, `web/src/lib/rivalries.ts`, `web/src/lib/program.ts`

- [ ] **Step 1: Scaffold Next.js in `web/`**

```bash
cd web
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --no-import-alias --use-npm
npm install @coral-xyz/anchor @solana/web3.js @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-wallets @solana/actions bn.js
```

Copy IDL to `web/src/idl/matchday_relic.json`.

- [ ] **Step 2: Rivalry config + helpers**

```typescript
// web/src/lib/rivalries.ts
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

export function padBytes(s: string, len: number): Buffer {
  const b = Buffer.alloc(len);
  Buffer.from(s).copy(b);
  return b;
}
```

```typescript
// web/src/lib/program.ts
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import idl from "@/idl/matchday_relic.json";

export const PROGRAM_ID = new PublicKey(/* from declare_id */);

export function rivalryPda(slug: string): PublicKey {
  const id = Buffer.alloc(32);
  Buffer.from(slug).copy(id);
  return PublicKey.findProgramAddressSync(
    [Buffer.from("rivalry"), id],
    PROGRAM_ID
  )[0];
}

export function getProgram(connection: Connection, wallet: any) {
  const provider = new AnchorProvider(connection, wallet, {});
  return new Program(idl as Idl, provider);
}
```

- [ ] **Step 3: Commit**

```bash
git add web
git commit -m "chore: scaffold Next.js web app with rivalry config"
```

---

### Task 6: Hybrid board UI (ticket stub + versus)

**Files:**
- Create: `web/src/components/TicketStub.tsx`, `VersusBoard.tsx`, `web/src/app/r/[slug]/page.tsx`
- Modify: `web/src/app/page.tsx`, `web/src/app/globals.css`

- [ ] **Step 1: Implement components**

`TicketStub`: shows title, sides, countdown from on-chain `windowEnd`, primary button linking to Blink URL  
`/api/actions/declare?slug=...&side=0` (Dialect blink client URL or `solana-action:` link).

`VersusBoard`: fetches rivalry account; displays `countA` / `countB` with side labels.

Closed state: if `now > windowEnd`, CTA label becomes “Gate closed — Relics locked” and button disabled.

Visual direction (from challenge frontend rules): stadium night atmosphere (gradients + subtle pitch texture), expressive display font (not Inter), brand **Matchday Relic** as hero signal on the ticket stub. Avoid purple-glow AI defaults.

- [ ] **Step 2: Manual check**

```bash
cd web && npm run dev
```

Open `/r/worldcup-arg-fra` — ticket + versus visible; countdown ticks.

- [ ] **Step 3: Commit**

```bash
git add web/src
git commit -m "feat: hybrid ticket stub and versus board UI"
```

---

### Task 7: Solana Actions / Blink `declare` route

**Files:**
- Create: `web/src/app/api/actions/declare/route.ts`
- Create: `web/src/app/actions.json/route.ts` (or `public/actions.json`)

- [ ] **Step 1: Implement Action GET + POST**

Follow Solana Actions spec:

- GET returns Action metadata with two buttons (Argentina / France or Nova / Volt based on slug) and optional motto text input if supported; otherwise fixed empty motto.
- POST builds a transaction calling `declare(side, motto)` for `account` (fan), with rivalry + allegiance PDAs, recent blockhash, fee payer = fan.
- Set headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET,POST,PUT,OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, Content-Encoding, Accept-Encoding
```

Use `@solana/actions` helpers (`createActionHeaders`, `ActionGetResponse`, `ActionPostResponse`) where possible.

Pseudo-structure:

```typescript
// GET → { title, icon, description, links: { actions: [ { label: sideA, href: "...&side=0" }, ...] } }
// POST body: { account: string } → { transaction: base64 }
```

- [ ] **Step 2: Verify with Actions inspector / blink client**

Open Dialect Blink inspector or `https://dial.to/?action=solana-action:<DEPLOYED_HTTPS_URL>/api/actions/declare?slug=worldcup-arg-fra`

Expected: metadata loads; signing produces confirmed tx on devnet; counts increment.

For local demo without public HTTPS: use `ngrok http 3000` or deploy web to Vercel.

- [ ] **Step 3: Commit**

```bash
git add web/src/app/api web/src/app/actions.json
git commit -m "feat: Solana Action Blink endpoint for declare"
```

---

### Task 8: Wallet-adapter fallback declare

**Files:**
- Create: `web/src/components/WalletProviders.tsx`, `WalletDeclare.tsx`
- Modify: board page to include fallback under CTA

- [ ] **Step 1: Wire providers + declare button**

On click: `program.methods.declare(side, motto).accounts({...}).rpc()`; toast success/error; refresh tallies.

Map `WindowClosed` to copy: “Gate closed — Relics locked”.

- [ ] **Step 2: Manual test with Phantom/Solflare on devnet**

Expected: declare without Blink works.

- [ ] **Step 3: Commit**

```bash
git add web/src
git commit -m "feat: wallet fallback declare on the board"
```

---

### Task 9: README + DEV submission draft

**Files:**
- Create: `README.md`, `SUBMISSION.md`

- [ ] **Step 1: README contents**

Include: challenge name/dates, what it is, architecture diagram (text), program id, seed commands, web env (`NEXT_PUBLIC_RPC`, `NEXT_PUBLIC_PROGRAM_ID`), Blink URL, note that repo started in challenge window, “commits after deadline will be listed here”.

- [ ] **Step 2: SUBMISSION.md** — DEV post draft using official template fields + `#weekendchallenge`, demo script steps, Best Use of Solana callout (Actions + time-gated PDA Relic).

- [ ] **Step 3: Commit**

```bash
git add README.md SUBMISSION.md
git commit -m "docs: README and DEV weekend challenge submission draft"
```

---

### Task 10: End-to-end verification checklist

- [ ] **Step 1: Run through success criteria**

- [ ] `anchor test` green  
- [ ] Devnet program deployed; both rivalries seeded; windows open for judges  
- [ ] Blink declare succeeds once  
- [ ] Site wallet declare succeeds once  
- [ ] Closed-window path demonstrated (closed rivalry fixture or demo clip)  
- [ ] Hybrid UI: ticket stub + versus  
- [ ] README + SUBMISSION ready; push GitHub remote; publish DEV post before **2026-07-13 06:59 UTC**

- [ ] **Step 2: Final commit if polish needed**

```bash
git status
git add -A
git commit -m "chore: final polish before challenge submission"
```

---

## Spec coverage check

| Spec requirement | Task |
|------------------|------|
| Rivalry + Allegiance PDAs | 2 |
| `create_rivalry` / `declare` + WindowClosed | 2–3 |
| Relic = `has_relic` flag | 2 |
| Sports + fandom seeds | 4, 5 |
| Hybrid ticket + versus UX | 6 |
| Blink Actions | 7 |
| Wallet fallback | 8 |
| Demo + DEV post | 9–10 |
| No Bubblegum / no betting | Out of scope (omitted) |

## Placeholder / consistency notes

- Program id placeholders replaced at Task 2 `anchor keys sync`.
- Anchor version: match installed CLI (0.30.x or 0.31.x); keep `init-if-needed` feature aligned.
- Side labels on-chain are bytes; UI uses `rivalries.ts` strings for display (decode on-chain for truth if time).
