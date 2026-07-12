//! LiteSVM integration tests for `declare` covering the match window.
//!
//! These load the compiled `matchday_relic.so` and drive it through LiteSVM,
//! so the program must be built first:
//!
//! ```text
//! anchor build --no-idl -- --arch v1
//! ```
//!
//! The default `--arch v0` SBF build crashes immediately (VM access
//! violation) under this LiteSVM/agave version, so `--arch v1` is required
//! for these tests to run. `anchor keys sync` + a plain `anchor build` is
//! still fine for IDL generation; just rebuild with `--arch v1` afterwards
//! before running `cargo test` / `anchor test`.

use std::path::PathBuf;

use anchor_lang::AccountDeserialize;
use litesvm::LiteSVM;
use matchday_relic::{Allegiance, Rivalry, LABEL_LEN, MOTTO_LEN, RIVALRY_ID_LEN};
use sha2::{Digest, Sha256};
use solana_address::Address;
use solana_clock::Clock;
use solana_instruction::{account_meta::AccountMeta, error::InstructionError, Instruction};
use solana_keypair::Keypair;
use solana_message::Message;
use solana_signer::Signer;
use solana_transaction::Transaction;
use solana_transaction_error::TransactionError;

fn program_id() -> Address {
    matchday_relic::ID
}

fn read_program_bytes() -> Vec<u8> {
    let mut so_path = PathBuf::from(env!("CARGO_MANIFEST_DIR"));
    so_path.push("../../target/deploy/matchday_relic.so");
    std::fs::read(&so_path).unwrap_or_else(|e| {
        panic!(
            "failed to read program at {:?}: {e}. Build it first with \
             `anchor build --no-idl -- --arch v1` (the default `--arch v0` SBF \
             build crashes immediately under LiteSVM's agave runtime).",
            so_path
        )
    })
}

/// Anchor's default instruction discriminator: first 8 bytes of
/// sha256("global:<instruction_name>").
fn sighash(name: &str) -> [u8; 8] {
    let mut hasher = Sha256::new();
    hasher.update(format!("global:{name}"));
    let digest = hasher.finalize();
    let mut out = [0u8; 8];
    out.copy_from_slice(&digest[..8]);
    out
}

fn pad32(s: &str) -> [u8; LABEL_LEN] {
    let mut out = [0u8; LABEL_LEN];
    let bytes = s.as_bytes();
    assert!(bytes.len() <= LABEL_LEN);
    out[..bytes.len()].copy_from_slice(bytes);
    out
}

fn pad_rivalry_id(s: &str) -> [u8; RIVALRY_ID_LEN] {
    let mut out = [0u8; RIVALRY_ID_LEN];
    let bytes = s.as_bytes();
    assert!(bytes.len() <= RIVALRY_ID_LEN);
    out[..bytes.len()].copy_from_slice(bytes);
    out
}

fn pad64(s: &str) -> [u8; MOTTO_LEN] {
    let mut out = [0u8; MOTTO_LEN];
    let bytes = s.as_bytes();
    assert!(bytes.len() <= MOTTO_LEN);
    out[..bytes.len()].copy_from_slice(bytes);
    out
}

fn rivalry_pda(program_id: &Address, rivalry_id: &[u8; RIVALRY_ID_LEN]) -> (Address, u8) {
    Address::find_program_address(&[b"rivalry", rivalry_id.as_ref()], program_id)
}

fn allegiance_pda(program_id: &Address, rivalry: &Address, fan: &Address) -> (Address, u8) {
    Address::find_program_address(&[b"allegiance", rivalry.as_ref(), fan.as_ref()], program_id)
}

fn setup() -> (LiteSVM, Address) {
    let program_id = program_id();
    let mut svm = LiteSVM::new();
    svm.add_program(program_id, &read_program_bytes()).unwrap();
    (svm, program_id)
}

fn set_clock(svm: &mut LiteSVM, unix_timestamp: i64) {
    let mut clock = svm.get_sysvar::<Clock>();
    clock.unix_timestamp = unix_timestamp;
    svm.set_sysvar::<Clock>(&clock);
}

fn create_rivalry(
    svm: &mut LiteSVM,
    program_id: &Address,
    authority: &Keypair,
    rivalry_id: [u8; RIVALRY_ID_LEN],
    window_start: i64,
    window_end: i64,
) -> Address {
    let (rivalry, _bump) = rivalry_pda(program_id, &rivalry_id);

    let mut data = sighash("create_rivalry").to_vec();
    data.extend_from_slice(&rivalry_id);
    data.extend_from_slice(&pad32("Home"));
    data.extend_from_slice(&pad32("Away"));
    data.extend_from_slice(&window_start.to_le_bytes());
    data.extend_from_slice(&window_end.to_le_bytes());

    let ix = Instruction {
        program_id: *program_id,
        accounts: vec![
            AccountMeta::new(authority.pubkey(), true),
            AccountMeta::new(rivalry, false),
            AccountMeta::new_readonly(Address::default(), false),
        ],
        data,
    };

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[ix], Some(&authority.pubkey()), &blockhash);
    let tx = Transaction::new(&[authority], msg, blockhash);
    svm.send_transaction(tx)
        .expect("create_rivalry should succeed");

    rivalry
}

fn declare(
    svm: &mut LiteSVM,
    program_id: &Address,
    fan: &Keypair,
    rivalry: &Address,
    side: u8,
    motto: [u8; MOTTO_LEN],
) -> Result<(), TransactionError> {
    let (allegiance, _bump) = allegiance_pda(program_id, rivalry, &fan.pubkey());

    let mut data = sighash("declare").to_vec();
    data.push(side);
    data.extend_from_slice(&motto);

    let ix = Instruction {
        program_id: *program_id,
        accounts: vec![
            AccountMeta::new(fan.pubkey(), true),
            AccountMeta::new(*rivalry, false),
            AccountMeta::new(allegiance, false),
            AccountMeta::new_readonly(Address::default(), false),
        ],
        data,
    };

    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(&[ix], Some(&fan.pubkey()), &blockhash);
    let tx = Transaction::new(&[fan], msg, blockhash);
    svm.send_transaction(tx).map(|_| ()).map_err(|f| f.err)
}

fn fund(svm: &mut LiteSVM, kp: &Keypair) {
    svm.airdrop(&kp.pubkey(), 10_000_000_000).unwrap();
}

fn load_rivalry(svm: &LiteSVM, rivalry: &Address) -> Rivalry {
    let account = svm.get_account(rivalry).expect("rivalry account exists");
    Rivalry::try_deserialize(&mut account.data.as_slice()).unwrap()
}

fn load_allegiance(svm: &LiteSVM, allegiance: &Address) -> Allegiance {
    let account = svm
        .get_account(allegiance)
        .expect("allegiance account exists");
    Allegiance::try_deserialize(&mut account.data.as_slice()).unwrap()
}

#[test]
fn declare_inside_window_sets_has_relic_and_increments_count_a() {
    let (mut svm, program_id) = setup();

    let now = 1_700_000_000_i64;
    set_clock(&mut svm, now);

    let authority = Keypair::new();
    let fan = Keypair::new();
    fund(&mut svm, &authority);
    fund(&mut svm, &fan);

    let rivalry_id = pad_rivalry_id("rivalry-inside-window");
    let rivalry = create_rivalry(
        &mut svm,
        &program_id,
        &authority,
        rivalry_id,
        now - 100,
        now + 100,
    );

    let (allegiance_addr, _bump) = allegiance_pda(&program_id, &rivalry, &fan.pubkey());

    declare(&mut svm, &program_id, &fan, &rivalry, 0, pad64("Go Home!"))
        .expect("declare inside window should succeed");

    let allegiance = load_allegiance(&svm, &allegiance_addr);
    assert!(allegiance.has_relic, "has_relic should be set to true");
    assert_eq!(allegiance.side, 0);

    let rivalry_state = load_rivalry(&svm, &rivalry);
    assert_eq!(
        rivalry_state.count_a, 1,
        "count_a should increment for side 0 declaration"
    );
    assert_eq!(rivalry_state.count_b, 0);
}

#[test]
fn declare_outside_window_fails_with_window_closed() {
    let (mut svm, program_id) = setup();

    let now = 1_700_000_000_i64;

    let authority = Keypair::new();
    let fan = Keypair::new();
    fund(&mut svm, &authority);
    fund(&mut svm, &fan);

    // Create the rivalry while the clock is inside the window, then advance
    // time past window_end before declaring, so the window has closed.
    set_clock(&mut svm, now);
    let rivalry_id = pad_rivalry_id("rivalry-outside-window");
    let rivalry = create_rivalry(
        &mut svm,
        &program_id,
        &authority,
        rivalry_id,
        now - 100,
        now + 100,
    );

    set_clock(&mut svm, now + 1_000);

    let err = declare(&mut svm, &program_id, &fan, &rivalry, 0, pad64("Too late")).unwrap_err();

    // WindowClosed is the first variant in MatchdayError, so its Anchor
    // error code is the custom-error base (6000).
    match err {
        TransactionError::InstructionError(_, InstructionError::Custom(code)) => {
            assert_eq!(code, 6000, "expected WindowClosed error code");
        }
        other => panic!("expected a custom WindowClosed error, got {other:?}"),
    }
}
