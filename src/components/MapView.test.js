import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';

// Must be declared before MapView is imported
vi.mock('leaflet', () => {
  const makeMarker = () => ({
    addTo: vi.fn().mockReturnThis(),
    bindPopup: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  });
  const mapInstance = {
    setView: vi.fn().mockReturnThis(),
  };
  return {
    default: {
      map: vi.fn(() => mapInstance),
      tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
      marker: vi.fn(() => makeMarker()),
      Icon: { Default: { prototype: {}, mergeOptions: vi.fn() } },
    },
  };
});

vi.mock('leaflet/dist/leaflet.css', () => ({}));
vi.mock('leaflet/dist/images/marker-icon.png', () => ({ default: '' }));
vi.mock('leaflet/dist/images/marker-icon-2x.png', () => ({ default: '' }));
vi.mock('leaflet/dist/images/marker-shadow.png', () => ({ default: '' }));

import L from 'leaflet';
import MapView from './MapView.vue';

describe('MapView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls L.marker once per truck on mount', async () => {
    const trucks = [
      { name: 'Taco Truck', lat: 37.77, lng: -122.41, cuisine: 'food' },
      { name: 'Pizza Van', lat: 37.78, lng: -122.42, cuisine: 'pizza' },
    ];

    mount(MapView, {
      props: { trucks, center: { lat: 37.77, lng: -122.41 } },
    });
    await flushPromises();

    expect(L.marker).toHaveBeenCalledTimes(2);
    expect(L.marker).toHaveBeenCalledWith([37.77, -122.41]);
    expect(L.marker).toHaveBeenCalledWith([37.78, -122.42]);
  });

  it('clears old markers and adds new ones when trucks prop changes', async () => {
    const wrapper = mount(MapView, {
      props: {
        trucks: [{ name: 'Old Truck', lat: 37.77, lng: -122.41, cuisine: null }],
        center: { lat: 37.77, lng: -122.41 },
      },
    });
    await flushPromises();

    await wrapper.setProps({
      trucks: [
        { name: 'New A', lat: 37.78, lng: -122.42, cuisine: null },
        { name: 'New B', lat: 37.79, lng: -122.43, cuisine: null },
      ],
    });
    await flushPromises();

    // 1 on mount + 2 after prop change = 3 total
    expect(L.marker).toHaveBeenCalledTimes(3);
  });
});
