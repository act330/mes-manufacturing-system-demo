<script setup>
defineProps({
  label: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: "info"
  }
});
</script>

<template>
  <span class="pill" :class="type">{{ label }}</span>
</template>
