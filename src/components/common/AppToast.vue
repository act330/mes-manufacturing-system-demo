<script setup>
defineProps({
  message: {
    type: String,
    required: true
  }
});
</script>

<template>
  <div class="toast">{{ message }}</div>
</template>
