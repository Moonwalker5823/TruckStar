<template>
  <div
    @click="$emit('select')"
    class="bg-gray-800 rounded-lg border border-gray-700 hover:border-orange-500 transition-colors overflow-hidden shrink-0 cursor-pointer"
  >
    <div class="relative h-36 bg-gradient-to-br from-gray-700 to-gray-800">
      <img
        v-if="truck.photo_reference"
        :src="`${$apiBase}/api/place-photo?ref=${encodeURIComponent(truck.photo_reference)}`"
        :alt="truck.name"
        class="w-full h-full object-cover"
        loading="lazy"
      />
      <div v-else class="flex items-center justify-center h-full px-4">
        <p class="text-base font-bold text-gray-200 text-center leading-snug">{{ truck.name }}</p>
      </div>
    </div>

    <div class="p-3 space-y-1.5">
      <h3 v-if="truck.photo_reference" class="font-semibold text-white text-sm leading-snug">
        {{ truck.name }}
      </h3>
      <span v-if="truck.cuisine" class="inline-block text-xs bg-orange-500/20 text-orange-400 rounded-full px-2 py-0.5 capitalize">
        {{ truck.cuisine.replace(/_/g, ' ') }}
      </span>
      <p v-if="truck.phone" class="text-xs text-gray-400 truncate">📞 {{ truck.phone }}</p>
      <p v-if="truck.website" class="text-xs text-orange-400 truncate">🌐 Website / Menu</p>
    </div>
  </div>
</template>

<script setup>
defineProps({ truck: { type: Object, required: true } });
defineEmits(['select']);
</script>
