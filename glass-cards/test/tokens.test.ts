import { describe, it, expect } from 'vitest';
import { FONT_FACE_CSS, hubTokens } from '../src/styles/tokens';

describe('tokens', () => {
  it('defines both themes', () => {
    const cssText = hubTokens.cssText;
    expect(cssText).toContain("[data-theme='natt']");
    expect(cssText).toContain("[data-theme='dag']");
    // spec §2 anchor values
    expect(cssText).toContain('#0A0A0C');
    expect(cssText).toContain('#F3F0E9');
    expect(cssText).toContain('#F5B63C'); // amber (natt)
    expect(cssText).toContain('#63D6C2'); // teal (natt)
  });
  it('font css is CDN-free and self-hosted', () => {
    expect(FONT_FACE_CSS).toContain('/local/glass-cards/fonts/outfit-variable.woff2');
    expect(FONT_FACE_CSS).toContain('/local/glass-cards/fonts/inter-variable.woff2');
    expect(FONT_FACE_CSS).not.toContain('http');
  });
});
