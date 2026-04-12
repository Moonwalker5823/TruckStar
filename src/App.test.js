import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

vi.mock('./components/MapView.vue', () => ({
  default: { name: 'MapView', props: ['trucks', 'center'], template: '<div class="mock-map" />' },
}));

import App from './App.vue';

describe('App', () => {
  beforeEach(() => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn((success) =>
          success({ coords: { latitude: 37.77, longitude: -122.41 } }),
        ),
      },
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows loading state while fetching', async () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {}))); // never resolves

    const wrapper = mount(App);

    // Loading is shown synchronously after geolocation resolves and fetch starts
    await vi.waitFor(() => expect(wrapper.text()).toContain('Searching...'));
  });

  it('passes fetched trucks to MapView', async () => {
    const mockTrucks = [
      { name: 'Taco Truck', lat: 37.77, lng: -122.41, cuisine: 'food' },
    ];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockTrucks),
    }));

    const wrapper = mount(App);
    await flushPromises();

    const mapView = wrapper.findComponent({ name: 'MapView' });
    expect(mapView.props('trucks')).toEqual(mockTrucks);
    expect(mapView.props('center')).toEqual({ lat: 37.77, lng: -122.41 });
  });

  it('shows error when geolocation is denied', async () => {
    Object.defineProperty(global.navigator, 'geolocation', {
      value: {
        getCurrentPosition: vi.fn((_, error) =>
          error(new Error('User denied geolocation')),
        ),
      },
      configurable: true,
    });

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.text()).toContain('Location access required');
  });

  it('shows error when API fetch fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Failed to fetch nearby trucks' }),
    }));

    const wrapper = mount(App);
    await flushPromises();

    expect(wrapper.text()).toContain('Failed to fetch nearby trucks');
  });
});
