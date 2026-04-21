<script setup>
import { computed } from "vue";

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  }
});

const chart = computed(() => {
  const data = props.data || [];
  const width = 720;
  const height = 300;
  const chartLeft = 48;
  const chartRight = 46;
  const chartTop = 18;
  const chartBottom = 48;
  const chartWidth = width - chartLeft - chartRight;
  const chartHeight = height - chartTop - chartBottom;

  if (!data.length) {
    return { width, height, gridLines: [], dots: [], outputPath: "", qualityPath: "" };
  }

  const outputValues = data.map((item) => item.output);
  const qualityValues = data.map((item) => item.quality);
  const outputMin = Math.min(...outputValues) - 10;
  const outputMax = Math.max(...outputValues) + 6;
  const qualityMin = 96.5;
  const qualityMax = 100;
  const stepX = chartWidth / Math.max(1, data.length - 1);

  const getOutputY = (value) =>
    chartTop + chartHeight - ((value - outputMin) / (outputMax - outputMin)) * chartHeight;
  const getQualityY = (value) =>
    chartTop + chartHeight - ((value - qualityMin) / (qualityMax - qualityMin)) * chartHeight;

  const outputPath = data
    .map((item, index) => `${index === 0 ? "M" : "L"} ${chartLeft + stepX * index} ${getOutputY(item.output)}`)
    .join(" ");

  const qualityPath = data
    .map((item, index) => `${index === 0 ? "M" : "L"} ${chartLeft + stepX * index} ${getQualityY(item.quality)}`)
    .join(" ");

  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((point) => {
    const y = chartTop + chartHeight * point;
    return {
      y,
      outputLabel: Math.round(outputMax - (outputMax - outputMin) * point),
      qualityLabel: `${(qualityMax - (qualityMax - qualityMin) * point).toFixed(1)}%`
    };
  });

  const dots = data.map((item, index) => ({
    x: chartLeft + stepX * index,
    yOutput: getOutputY(item.output),
    yQuality: getQualityY(item.quality),
    month: item.month
  }));

  return { width, height, chartLeft, chartRight, outputPath, qualityPath, gridLines, dots };
});
</script>

<template>
  <svg class="chart-svg" :viewBox="`0 0 ${chart.width} ${chart.height}`" aria-label="产量及合格率趋势图">
    <template v-for="line in chart.gridLines" :key="line.y">
      <line
        :x1="chart.chartLeft"
        :y1="line.y"
        :x2="chart.width - chart.chartRight"
        :y2="line.y"
        stroke="rgba(91,126,180,0.14)"
        stroke-dasharray="4 6"
      />
      <text :x="chart.chartLeft - 10" :y="line.y + 4" fill="#7b8ba3" font-size="12" text-anchor="end">
        {{ line.outputLabel }}
      </text>
      <text :x="chart.width - chart.chartRight + 10" :y="line.y + 4" fill="#7b8ba3" font-size="12">
        {{ line.qualityLabel }}
      </text>
    </template>

    <path :d="chart.outputPath" fill="none" stroke="#2f80ff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <path :d="chart.qualityPath" fill="none" stroke="#22c2c8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />

    <template v-for="dot in chart.dots" :key="dot.month">
      <circle :cx="dot.x" :cy="dot.yOutput" r="4" fill="#2f80ff" />
      <circle :cx="dot.x" :cy="dot.yQuality" r="4" fill="#22c2c8" />
      <text :x="dot.x" :y="chart.height - 18" fill="#7b8ba3" font-size="12" text-anchor="middle">{{ dot.month }}</text>
    </template>
  </svg>
</template>
