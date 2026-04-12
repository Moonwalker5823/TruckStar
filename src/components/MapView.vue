<template>
  <div ref="mapContainer" class="w-full h-full" />
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

const props = defineProps({
  trucks: { type: Array, default: () => [] },
  center: { type: Object, default: () => ({ lat: 37.7749, lng: -122.4194 }) },
});

const mapContainer = ref(null);
// These are plain JS values, not reactive — Leaflet objects must not be wrapped in Vue proxies
let map = null;
const markers = [];

function clearMarkers() {
  markers.forEach(m => m.remove());
  markers.length = 0;
}

function addMarkers(trucks) {
  trucks.forEach(truck => {
    if (truck.lat == null || truck.lng == null) return;
    const marker = L.marker([truck.lat, truck.lng])
      .addTo(map)
      .bindPopup(`<strong>${truck.name}</strong>`);
    markers.push(marker);
  });
}

onMounted(() => {
  // Apply icon fix here (not at module scope) to avoid side-effects at import time
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconUrl: markerIconUrl,
    iconRetinaUrl: markerIcon2xUrl,
    shadowUrl: markerShadowUrl,
  });

  map = L.map(mapContainer.value).setView(
    [props.center.lat, props.center.lng],
    14,
  );

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  addMarkers(props.trucks);
});

onUnmounted(() => {
  if (map) {
    map.remove();
    map = null;
  }
});

watch(
  () => props.trucks,
  newTrucks => {
    if (!map) return;
    clearMarkers();
    addMarkers(newTrucks);
  },
  { deep: true },
);

watch(
  () => props.center,
  newCenter => {
    if (!map || !newCenter) return;
    map.setView([newCenter.lat, newCenter.lng], map.getZoom());
  },
);
</script>
