#[test]
fn program_constants_match_spec() {
    assert_eq!(matchday_relic::constants::RIVALRY_ID_LEN, 32);
    assert_eq!(matchday_relic::constants::LABEL_LEN, 32);
    assert_eq!(matchday_relic::constants::MOTTO_LEN, 64);
}
