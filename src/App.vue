<template>
  <div class="flex flex-col h-screen bg-gray-900 text-white">
    <header class="flex items-center justify-between px-6 py-4 bg-gray-800 shadow-md shrink-0">
      <h1 class="text-2xl font-bold tracking-tight">Food Truck Finder</h1>
      <div class="flex items-center gap-4">
        <span v-if="error" class="text-sm text-red-400">{{ error }}</span>
        <span v-if="loading" class="text-sm text-gray-400">Searching...</span>
        <button
          @click="refresh"
          :disabled="loading"
          class="px-4 py-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm font-semibold transition-colors"
        >
          Refresh Location
        </button>
      </div>
    </header>
    <main class="flex-1 overflow-hidden">
      <MapView :trucks="trucks" :center="userLocation" />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import MapView from './components/MapView.vue';

const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 };

const trucks = ref([]);
const userLocation = ref(DEFAULT_CENTER);
const loading = ref(false);
const error = ref(null);

function getLocation() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error('Location access required. Please allow location in your browser.')),
    );
  });
}

async function fetchTrucks(lat, lng) {
  const response = await fetch(`/api/food-trucks?lat=${lat}&lng=${lng}`);
  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch nearby trucks');
  }
  return response.json();
}

async function refresh() {
  loading.value = true;
  error.value = null;
  try {
    const location = await getLocation();
    userLocation.value = location;
    trucks.value = await fetchTrucks(location.lat, location.lng);
  } catch (err) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
}

onMounted(refresh);
</script>
