<template>
  <Teleport to="body">
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      @click.self="$emit('close')"
    >
      <div class="bg-gray-800 rounded-2xl border border-gray-700 w-full max-w-lg overflow-hidden shadow-2xl">
        <!-- Photo or gradient banner -->
        <div class="relative h-56 bg-gradient-to-br from-gray-700 to-gray-900">
          <img
            v-if="truck.photo_reference"
            :src="`/api/place-photo?ref=${encodeURIComponent(truck.photo_reference)}&maxwidth=800`"
            :alt="truck.name"
            class="w-full h-full object-cover"
          />
          <div v-else class="flex items-center justify-center h-full px-8">
            <h2 class="text-2xl font-bold text-white text-center leading-snug">{{ truck.name }}</h2>
          </div>
          <button
            @click="$emit('close')"
            class="absolute top-3 right-3 bg-black/50 hover:bg-black/70 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <!-- Details -->
        <div class="p-6 space-y-4">
          <div>
            <h2 v-if="truck.photo_reference" class="text-xl font-bold text-white">{{ truck.name }}</h2>
            <span v-if="truck.cuisine" class="inline-block text-sm bg-orange-500/20 text-orange-400 rounded-full px-3 py-1 capitalize mt-1">
              {{ truck.cuisine.replace(/_/g, ' ') }}
            </span>
            <p v-if="truck.tagline" class="text-sm text-gray-400 mt-2">{{ truck.tagline }}</p>
            <p v-if="truck.city" class="text-xs text-gray-500 mt-1">{{ truck.city }}</p>
          </div>

          <div class="space-y-3 border-t border-gray-700 pt-4">
            <a
              v-if="truck.phone"
              :href="`tel:${truck.phone}`"
              class="flex items-center gap-3 text-sm text-gray-300 hover:text-white transition-colors"
            >
              <span class="text-lg">📞</span>
              <span>{{ truck.phone }}</span>
            </a>
            <a
              v-if="truck.website"
              :href="truck.website"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-3 text-sm text-orange-400 hover:text-orange-300 transition-colors min-w-0"
            >
              <span class="text-lg shrink-0">🌐</span>
              <span class="truncate">Website / Menu</span>
            </a>
            <a
              v-if="truck.maps_url"
              :href="truck.maps_url"
              target="_blank"
              rel="noopener"
              class="flex items-center gap-3 text-sm text-gray-400 hover:text-gray-300 transition-colors"
            >
              <span class="text-lg">📍</span>
              <span>View on Google Maps</span>
            </a>
          </div>

          <div class="text-xs text-gray-600 font-mono pt-1">
            {{ truck.lat.toFixed(5) }}, {{ truck.lng.toFixed(5) }}
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
defineProps({ truck: { type: Object, required: true } });
defineEmits(['close']);
</script>
