<template>
  <div ref="mapContainer" class="w-full h-full" />
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png';
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png';

// Fix broken marker icons in Vite builds
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIconUrl,
  iconRetinaUrl: markerIcon2xUrl,
  shadowUrl: markerShadowUrl,
});

const props = defineProps({
  trucks: { type: Array, default: () => [] },
  center: { type: Object, default: () => ({ lat: 37.7749, lng: -122.4194 }) },
});

const mapContainer = ref(null);
let map = null;
const markers = [];

function clearMarkers() {
  markers.forEach(m => m.remove());
  markers.length = 0;
}

function addMarkers(trucks) {
  trucks.forEach(truck => {
    const marker = L.marker([truck.lat, truck.lng])
      .addTo(map)
      .bindPopup(`<strong>${truck.name}</strong>`);
    markers.push(marker);
  });
}

onMounted(() => {
  map = L.map(mapContainer.value).setView(
    [props.center.lat, props.center.lng],
    14,
  );

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(map);

  addMarkers(props.trucks);
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
    map.setView([newCenter.lat, newCenter.lng], 14);
  },
);
</script>
