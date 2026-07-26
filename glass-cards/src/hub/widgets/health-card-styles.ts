import { css } from 'lit';

/**
 * Shared chrome for the four Hälsa cards. Import after hubTokens; each card adds
 * only what is specific to it.
 *
 * Card surfaces stay lavender — the same domain tint as the Kcal page, since
 * kropp och kost are one domain — while *semantic* colour (green/amber/coral) is
 * reserved for the two scored metrics. A score is the only thing here that can
 * be good or bad; spending domain colour on it would waste the one signal the
 * palette has, and tinting all four cards by status would make a wall panel
 * flicker between moods every morning.
 */
export const healthCardStyles = css`
  /* Padding is height-aware as well as width-aware: a 2×2 deck has to fit a
     landscape wall panel without scrolling, and vertical padding is the first
     thing that should give on a short viewport. */
  .card {
    box-sizing: border-box;
    min-height: 0;
    display: flex;
    flex-direction: column;
    padding: clamp(14px, 2vh, 26px) clamp(18px, 2.2vw, 30px);
    border-radius: var(--hub-radius-lg);
    background: var(--hub-lavender-bg);
    border: 1px solid var(--hub-lavender-border);
    box-shadow: var(--hub-shadow);
  }

  .eyebrow {
    font: 600 12px var(--hub-font-body);
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--hub-text-dim);
  }

  /* Headline value. Light display weight at large size is what makes the panel
     read as calm rather than as a dashboard. */
  .value-row {
    display: flex;
    align-items: baseline;
    gap: 10px;
    margin-top: 6px;
    flex-wrap: wrap;
  }
  .value {
    font: 200 clamp(34px, min(5.2vw, 6.4vh), 58px) / 1 var(--hub-font-display);
    letter-spacing: -0.03em;
    color: var(--hub-text);
    font-variant-numeric: tabular-nums;
  }
  .unit {
    font: 500 15px var(--hub-font-body);
    color: var(--hub-text-muted);
  }

  /* Score pill, tinted by band. */
  .score {
    display: inline-flex;
    align-items: baseline;
    gap: 5px;
    padding: 5px 11px;
    border-radius: var(--hub-radius-pill);
    font: 600 15px var(--hub-font-body);
    font-variant-numeric: tabular-nums;
    background: var(--hub-chip-bg);
    border: 1px solid var(--hub-chip-border);
    color: var(--hub-text-muted);
  }
  .score.tone-green {
    background: var(--hub-green-bg);
    border-color: var(--hub-green-border);
    color: var(--hub-green);
  }
  .score.tone-amber {
    background: var(--hub-amber-bg);
    border-color: var(--hub-amber-border);
    color: var(--hub-amber-text);
  }
  .score.tone-coral {
    background: var(--hub-coral-bg);
    border-color: var(--hub-coral-border);
    color: var(--hub-coral);
  }
  .score-label {
    font: 500 11px var(--hub-font-body);
    letter-spacing: 0.03em;
    text-transform: uppercase;
    opacity: 0.75;
  }

  /* Secondary facts: paired label/value, dot-separated on one line. */
  .facts {
    display: flex;
    align-items: baseline;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 12px;
    font: 500 13.5px var(--hub-font-body);
    color: var(--hub-text-muted);
    font-variant-numeric: tabular-nums;
  }
  .facts .sep {
    color: var(--hub-text-dim);
  }
  .facts b {
    font-weight: 600;
    color: var(--hub-lavender-text);
  }

  /* Trend area. Pushed to the bottom so all four cards align on their
     sparkline baseline regardless of how much text sits above it. */
  .trend {
    margin-top: auto;
    padding-top: clamp(10px, 1.6vh, 20px);
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
  }
  .trend-foot {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 10px;
    margin-top: 6px;
    font: 500 11.5px var(--hub-font-body);
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--hub-text-dim);
  }
  /* Seeded from 70 days of history, so this should be rare — but a fresh
     install, a failed seed, or a metric Oura has not established a baseline for
     all land here, and an empty card must still look deliberate. */
  .trend-empty {
    font: 400 13.5px var(--hub-font-body);
    color: var(--hub-text-dim);
    text-align: center;
    padding: 18px 0;
  }
  .dash {
    color: var(--hub-text-dim);
  }
`;
