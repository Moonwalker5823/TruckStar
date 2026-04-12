<template>
  <div class="flex flex-col h-full">
    <button
      @click="$emit('close')"
      class="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white mb-3 shrink-0 transition-colors"
    >
      ← Back to results
    </button>

    <!-- Photo or name banner -->
    <div class="relative h-44 rounded-xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900 shrink-0">
      <img
        v-if="truck.photo_reference"
        :src="`/api/place-photo?ref=${encodeURIComponent(truck.photo_reference)}&maxwidth=600`"
        :alt="truck.name"
        class="w-full h-full object-cover"
      />
      <div v-else class="flex items-center justify-center h-full px-4">
        <p class="text-lg font-bold text-white text-center leading-snug">{{ truck.name }}</p>
      </div>
    </div>

    <!-- Scrollable details -->
    <div class="flex-1 overflow-y-auto mt-3 pr-1 space-y-3">
      <div>
        <h3 v-if="truck.photo_reference" class="font-semibold text-white">{{ truck.name }}</h3>
        <span v-if="truck.cuisine" class="inline-block text-xs bg-orange-500/20 text-orange-400 rounded-full px-2 py-0.5 capitalize mt-1">
          {{ truck.cuisine.replace(/_/g, ' ') }}
        </span>
        <p v-if="truck.tagline" class="text-xs text-gray-400 mt-2 leading-relaxed">{{ truck.tagline }}</p>
        <p v-if="truck.city" class="text-xs text-gray-500 mt-1">{{ truck.city }}</p>
      </div>

      <div class="space-y-2.5 border-t border-gray-700 pt-3">
        <a
          v-if="truck.phone"
          :href="`tel:${truck.phone}`"
          class="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors"
        >
          <span>📞</span>{{ truck.phone }}
        </a>
        <a
          v-if="truck.website"
          :href="truck.website"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-2 text-sm text-orange-400 hover:text-orange-300 transition-colors min-w-0"
        >
          <span class="shrink-0">🌐</span><span class="truncate">Website / Menu</span>
        </a>
        <a
          v-if="truck.maps_url"
          :href="truck.maps_url"
          target="_blank"
          rel="noopener"
          class="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-300 transition-colors"
        >
          <span>🗺️</span>View on Google Maps
        </a>
        <button
          @click="$emit('show-on-map', { lat: truck.lat, lng: truck.lng })"
          class="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors w-full text-left"
        >
          <span>📍</span>
          <span class="font-mono text-xs">{{ truck.lat.toFixed(5) }}, {{ truck.lng.toFixed(5) }} — Show on Map</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({ truck: { type: Object, required: true } });
defineEmits(['close', 'show-on-map']);
</script>
