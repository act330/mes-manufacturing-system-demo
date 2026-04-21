<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  detail: {
    type: String,
    required: true
  }
});
</script>

<template>
  <div class="clipboard-notice">
    <div class="clipboard-notice-badge">✓</div>
    <div class="clipboard-notice-copy">
      <strong>{{ title }}</strong>
      <span>{{ detail }}</span>
    </div>
  </div>
</template>
