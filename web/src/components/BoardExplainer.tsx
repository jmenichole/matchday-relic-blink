type BoardExplainerProps = {
  gateOpen: boolean;
  loading: boolean;
  windowMissing: boolean;
  blinkPath: string;
};

export function BoardExplainer({
  gateOpen,
  loading,
  windowMissing,
  blinkPath,
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
      <div className="board-explainer-claim">
        <p>
          <strong>How to claim (recommended):</strong> scroll to{" "}
          <em>Claim Relic with wallet</em>, pick a side, connect any Solana
          wallet on Devnet, and tap Declare &amp; stamp.
        </p>
        <p className="mt-3">
          <strong>What is a Blink?</strong> A Blink is a Solana Action — a
          special link that builds the same declare transaction. Dial.to often
          fails in browsers, so we host an{" "}
          <a className="board-explainer-link" href={blinkPath}>
            in-app Blink page
          </a>{" "}
          that talks to our Action API and lets your wallet sign here.
        </p>
      </div>
    </section>
  );
}
