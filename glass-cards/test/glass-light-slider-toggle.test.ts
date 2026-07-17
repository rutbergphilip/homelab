import { describe, it, expect, vi } from 'vitest';
import '../src/cards/glass-light-slider';
import type { HomeAssistant } from '../src/types';

interface Call {
  domain: string;
  service: string;
  data?: Record<string, unknown>;
  target?: { entity_id: string | string[] };
}

function makeHass(state: string, calls: Call[]): HomeAssistant {
  return {
    states: {
      'light.test': {
        entity_id: 'light.test',
        state,
        attributes: { friendly_name: 'Test', brightness: 255 },
        last_changed: '',
        last_updated: '',
        context: { id: '', parent_id: null, user_id: null },
      },
    },
    callService: (domain, service, data, target) => {
      calls.push({ domain, service, data, target });
      return Promise.resolve();
    },
    formatEntityState: () => '',
    formatEntityAttributeValue: () => '',
    locale: { language: 'sv' },
    themes: { darkMode: true },
    user: { name: 'x' },
  } as HomeAssistant;
}

async function mount(state: string, calls: Call[]) {
  const el = document.createElement('glass-light-slider') as HTMLElement & {
    setConfig: (c: unknown) => void;
    hass: HomeAssistant;
    updateComplete: Promise<unknown>;
  };
  el.setConfig({ type: 'glass-light-slider', entity: 'light.test', name: 'Test' });
  el.hass = makeHass(state, calls);
  document.body.appendChild(el);
  await el.updateComplete;
  return el;
}

describe('glass-light-slider icon toggle', () => {
  it('toggles the entity when the icon button is tapped', async () => {
    const calls: Call[] = [];
    const el = await mount('on', calls);
    const btn = el.shadowRoot!.querySelector('.light-icon-btn') as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.getAttribute('aria-pressed')).toBe('true');

    btn.click();

    expect(calls).toContainEqual({
      domain: 'light',
      service: 'toggle',
      data: undefined,
      target: { entity_id: 'light.test' },
    });
    el.remove();
  });

  it('reflects the off state via aria-pressed', async () => {
    const el = await mount('off', []);
    const btn = el.shadowRoot!.querySelector('.light-icon-btn') as HTMLButtonElement;
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    el.remove();
  });

  it('stops pointerdown propagation so a parent swipe/drag never starts', async () => {
    const el = await mount('on', []);
    const btn = el.shadowRoot!.querySelector('.light-icon-btn') as HTMLButtonElement;
    const ev = new Event('pointerdown', { bubbles: true });
    const spy = vi.spyOn(ev, 'stopPropagation');
    btn.dispatchEvent(ev);
    expect(spy).toHaveBeenCalled();
    el.remove();
  });
});
