import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { renderWithIntl } from '../helpers/intl';
import { ChurchMap, RTL_TEXT_PLUGIN_URL } from '@/components/explore/ChurchMap';

const captured = vi.hoisted(() => ({ props: null as Record<string, unknown> | null }));

// MapLibre needs WebGL, so replace the map with a stub that records its props.
vi.mock('react-map-gl/maplibre', () => ({
  default: (props: Record<string, unknown>) => {
    captured.props = props;
    return null;
  },
  Marker: () => null,
  Popup: () => null,
  NavigationControl: () => null,
}));
vi.mock('@/lib/i18n/navigation', async () => (await import('../helpers/mocks')).navigationModule);

describe('ChurchMap', () => {
  it('loads the RTL text plugin so Hebrew and Arabic labels are not drawn backwards', () => {
    renderWithIntl(<ChurchMap churches={[]} />);
    expect(captured.props?.RTLTextPlugin).toEqual({ pluginUrl: RTL_TEXT_PLUGIN_URL, lazy: true });
  });

  it('serves the plugin from this site, not a third-party CDN', () => {
    expect(RTL_TEXT_PLUGIN_URL).toMatch(/^\/vendor\//);
    expect(existsSync(resolve(process.cwd(), 'public', RTL_TEXT_PLUGIN_URL.slice(1)))).toBe(true);
  });
});
