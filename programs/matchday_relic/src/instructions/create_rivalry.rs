use anchor_lang::prelude::*;

use crate::{
    constants::{LABEL_LEN, RIVALRY_ID_LEN, RIVALRY_SEED},
    error::MatchdayError,
    state::Rivalry,
};

#[derive(Accounts)]
#[instruction(rivalry_id: [u8; RIVALRY_ID_LEN])]
pub struct CreateRivalry<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,
    #[account(
        init,
        payer = authority,
        space = 8 + Rivalry::INIT_SPACE,
        seeds = [RIVALRY_SEED, rivalry_id.as_ref()],
        bump
    )]
    pub rivalry: Account<'info, Rivalry>,
    pub system_program: Program<'info, System>,
}

pub fn handle_create_rivalry(
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
