import { css } from 'lit';

/**
 * Shared popup shell: blurred scrim + centered card. On phones (≤600px) the
 * card becomes a full-screen sheet. Import into every hub popup's styles array
 * after hubTokens; the component adds only its content styles.
 */
export const popupStyles = css`
  :host {
    position: absolute;
    inset: 0;
    z-index: 40;
  }
  .scrim {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    box-sizing: border-box;
    background: var(--hub-scrim);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    animation: fade 0.2s ease;
  }
  @keyframes fade {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  .card {
    width: 100%;
    max-width: 560px;
    max-height: 100%;
    overflow: auto;
    box-sizing: border-box;
    padding: 20px;
    border-radius: var(--hub-radius-lg);
    background: var(--hub-card);
    border: 1px solid var(--hub-card-border);
    box-shadow: var(--hub-shadow);
    animation: pop 0.25s cubic-bezier(0.2, 0.8, 0.2, 1);
  }
  @keyframes pop {
    from { opacity: 0; transform: translateY(12px) scale(0.98); }
    to { opacity: 1; transform: none; }
  }
  .head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }
  .title {
    font: 500 22px var(--hub-font-display);
    letter-spacing: -0.01em;
    color: var(--hub-text);
  }
  .close {
    width: 48px;
    height: 48px;
    margin: -8px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--hub-text-muted);
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  .close svg {
    width: 22px;
    height: 22px;
  }
  @media (max-width: 600px) {
    .scrim { padding: 0; }
    .card {
      max-width: none;
      height: 100%;
      max-height: none;
      border-radius: 0;
    }
  }
`;
