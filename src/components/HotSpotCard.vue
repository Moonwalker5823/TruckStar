<template>
  <div
    @click="$emit('select')"
    class="bg-gray-800 rounded-lg border border-gray-700 hover:border-orange-500 transition-colors p-4 cursor-pointer"
  >
    <h3 class="font-semibold text-white text-sm leading-snug">{{ truck.name }}</h3>
    <span v-if="truck.cuisine" class="inline-block text-xs bg-orange-500/20 text-orange-400 rounded-full px-2 py-0.5 capitalize mt-1.5">
      {{ truck.cuisine }}
    </span>
    <p v-if="truck.tagline" class="text-xs text-gray-400 mt-2 leading-relaxed line-clamp-2">{{ truck.tagline }}</p>
    <p v-if="truck.city" class="text-xs text-gray-500 mt-1">{{ truck.city }}</p>
  </div>
</template>

<script setup>
defineProps({ truck: { type: Object, required: true } });
defineEmits(['select']);
</script>
