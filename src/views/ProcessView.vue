<script setup>
import { storeToRefs } from "pinia";
import { useMesStore } from "../stores/mes";

const mesStore = useMesStore();
const { dataState } = storeToRefs(mesStore);
</script>

<template>
  <section class="page-grid">
    <div class="card">
      <div class="card-head">
        <div>
          <h3 class="card-title">工艺路线</h3>
          <p class="card-subtitle">版本、工序步骤、标准节拍和质量基线</p>
        </div>
      </div>
      <div class="card-body">
        <div class="route-list">
          <div v-for="item in dataState.processRoutes" :key="item.code" class="route-item">
            <strong>{{ item.code }} · {{ item.product }}</strong>
            <small>版本 {{ item.version }} · 标准节拍 {{ item.cycle }} · 当前直通率 {{ item.passRate }}%</small>
            <div class="tag-row">
              <span v-for="step in item.steps" :key="step" class="tag">{{ step }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
