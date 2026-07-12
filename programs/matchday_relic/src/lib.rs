pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use error::*;
pub use instructions::*;
pub use state::*;

declare_id!("6Ls8cPe4oBUE6WWsdEKCqTCMZACQCfMLF4xLWAGb7SoA");

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
        crate::instructions::create_rivalry::handle_create_rivalry(
            ctx,
            rivalry_id,
            side_a,
            side_b,
            window_start,
            window_end,
        )
    }

    pub fn declare(ctx: Context<Declare>, side: u8, motto: [u8; MOTTO_LEN]) -> Result<()> {
        crate::instructions::declare::handle_declare(ctx, side, motto)
    }
}
