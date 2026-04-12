<template>
  <div class="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-orange-500 transition-colors cursor-default shrink-0">
    <h3 class="font-semibold text-white leading-snug">{{ truck.name }}</h3>
    <p v-if="truck.cuisine" class="text-sm text-orange-400 mt-1 capitalize">
      {{ truck.cuisine.replace(/_/g, ' ') }}
    </p>
    <p class="text-xs text-gray-500 mt-2 font-mono">
      {{ truck.lat.toFixed(4) }}, {{ truck.lng.toFixed(4) }}
    </p>
  </div>
</template>

<script setup>
defineProps({
  truck: { type: Object, required: true },
});
</script>
