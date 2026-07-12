use anchor_lang::prelude::*;

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
