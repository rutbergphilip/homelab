import { css } from 'lit';

export const glassVariables = css`
  :host {
    --glass-bg: rgba(255, 255, 255, 0.06);
    --glass-bg-hover: rgba(255, 255, 255, 0.10);
    --glass-bg-active: rgba(255, 255, 255, 0.14);
    --glass-border: rgba(255, 255, 255, 0.10);
    --glass-border-active: rgba(79, 195, 247, 0.30);
    --glass-accent: #4FC3F7;
    --glass-accent-light: #B3E5FC;
    --glass-accent-glow: rgba(79, 195, 247, 0.30);
    --glass-text-primary: rgba(255, 255, 255, 0.95);
    --glass-text-secondary: rgba(255, 255, 255, 0.55);
    --glass-text-dim: rgba(255, 255, 255, 0.35);
    --glass-radius: 16px;
    --glass-radius-sm: 10px;
    --glass-radius-pill: 50px;
    --glass-blur: 20px;
    --glass-transition: 0.3s ease;
    --glass-coral: #EF5350;
    --glass-green: #66BB6A;
  }
`;
