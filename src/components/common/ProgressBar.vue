<script setup>
import { computed } from "vue";

const props = defineProps({
  value: {
    type: Number,
    required: true
  }
});

const width = computed(() => `${Math.max(0, Math.min(100, Number(props.value || 0)))}%`);
</script>

<template>
  <div class="progress-track">
    <span class="progress-value" :style="{ width }"></span>
  </div>
</template>
