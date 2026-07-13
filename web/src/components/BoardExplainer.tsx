type BoardExplainerProps = {
  gateOpen: boolean;
  loading: boolean;
  windowMissing: boolean;
};

export function BoardExplainer({
  gateOpen,
  loading,
  windowMissing,
}: BoardExplainerProps) {
  const statusLabel = loading
    ? "Checking gate."
    : windowMissing
      ? "Window not seeded yet"
      : gateOpen
        ? "Gate open - claim now"
        : "Gate locked - Relics sealed";

  const statusHint = loading
    ? "Loading the Matchday window from Solana."
    : windowMissing
      ? "Deploy and seed this rivalry, then refresh to open the gate."
      : gateOpen
        ? "You can still earn a Relic. After the countdown hits zero, new claims are rejected on-chain."
        : "The Matchday window has closed. Existing Relics stay; no new stamps can be earned.";

  return (
    <section className="board-explainer" aria-label="What is a Relic">
      <p className="board-explainer-lead">
        A <strong>Relic</strong> is your on-chain allegiance stamp for this
        rivalry - side, motto, and timestamp - earned only while the Matchday
        window is open.
      </p>
      <p className="board-explainer-status">
        <span className="board-explainer-status-label">{statusLabel}</span>
        <span className="board-explainer-status-hint">{statusHint}</span>
      </p>
      <p className="board-explainer-claim">
        <strong>Claim with your wallet below</strong> - that is the main path.
        A <strong>Blink</strong> is a shareable Solana claim button (via Dial.to)
        so someone can declare from a feed without browsing this page first. Use
        it to share; use the wallet form here to stamp your own Relic.
      </p>
    </section>
  );
}
