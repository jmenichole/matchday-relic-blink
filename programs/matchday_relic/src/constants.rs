use anchor_lang::prelude::*;

pub const RIVALRY_ID_LEN: usize = 32;
pub const LABEL_LEN: usize = 32;
pub const MOTTO_LEN: usize = 64;

#[constant]
pub const RIVALRY_SEED: &[u8] = b"rivalry";

#[constant]
pub const ALLEGIANCE_SEED: &[u8] = b"allegiance";
