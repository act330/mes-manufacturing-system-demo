<script setup>
import { computed } from "vue";

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
});

const total = computed(() => props.items.reduce((sum, item) => sum + Number(item.value || 0), 0));

const gradient = computed(() => {
  let current = 0;
  return props.items
    .map((item) => {
      const start = total.value ? (current / total.value) * 100 : 0;
      current += Number(item.value || 0);
      const end = total.value ? (current / total.value) * 100 : 0;
      return `${item.color} ${start}% ${end}%`;
    })
    .join(", ");
});
</script>

<template>
  <div class="donut-layout">
    <div class="donut" :style="{ background: `conic-gradient(${gradient})` }">
      <div class="donut-center">
        <div>
          {{ total }}
          <span>本周不良总数</span>
        </div>
      </div>
    </div>

    <div class="legend-list">
      <div v-for="item in items" :key="item.name" class="legend-row">
        <span class="legend-dot" :style="{ background: item.color }"></span>
        <strong>{{ item.name }}</strong>
        <span>{{ item.value }} 件</span>
        <span>{{ total ? ((item.value / total) * 100).toFixed(1) : "0.0" }}%</span>
      </div>
    </div>
  </div>
</template>
