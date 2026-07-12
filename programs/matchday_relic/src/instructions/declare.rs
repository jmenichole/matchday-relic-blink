use anchor_lang::prelude::*;

use crate::{
    constants::{ALLEGIANCE_SEED, MOTTO_LEN, RIVALRY_SEED},
    error::MatchdayError,
    state::{Allegiance, Rivalry},
};

#[derive(Accounts)]
pub struct Declare<'info> {
    #[account(mut)]
    pub fan: Signer<'info>,
    #[account(
        mut,
        seeds = [RIVALRY_SEED, rivalry.rivalry_id.as_ref()],
        bump = rivalry.bump
    )]
    pub rivalry: Account<'info, Rivalry>,
    #[account(
        init_if_needed,
        payer = fan,
        space = 8 + Allegiance::INIT_SPACE,
        seeds = [ALLEGIANCE_SEED, rivalry.key().as_ref(), fan.key().as_ref()],
        bump
    )]
    pub allegiance: Account<'info, Allegiance>,
    pub system_program: Program<'info, System>,
}

pub fn handle_declare(
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
