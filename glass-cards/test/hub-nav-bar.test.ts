import { describe, it, expect } from 'vitest';
import { navItem } from '../src/hub/widgets/hub-nav-bar';

describe('navItem', () => {
  it('maps each page to its label, icon and domain tone', () => {
    expect(navItem('hem')).toEqual({ id: 'hem', label: 'Hem', icon: 'home', tone: 'neutral' });
    expect(navItem('ljus')).toEqual({ id: 'ljus', label: 'Ljus', icon: 'lamp', tone: 'amber' });
    expect(navItem('media')).toEqual({ id: 'media', label: 'Media', icon: 'note', tone: 'teal' });
    expect(navItem('energi')).toEqual({ id: 'energi', label: 'Energi', icon: 'bolt', tone: 'green' });
    expect(navItem('kcal')).toEqual({ id: 'kcal', label: 'Kcal', icon: 'ring', tone: 'lavender' });
  });

  it('falls back to a neutral, icon-less item titled from the id', () => {
    expect(navItem('gäster')).toEqual({ id: 'gäster', label: 'Gäster', icon: '', tone: 'neutral' });
  });
});
