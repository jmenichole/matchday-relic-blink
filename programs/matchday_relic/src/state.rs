use anchor_lang::prelude::*;

use crate::constants::{LABEL_LEN, MOTTO_LEN, RIVALRY_ID_LEN};

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
