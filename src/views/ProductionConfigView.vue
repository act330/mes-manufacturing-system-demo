<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import ProgressBar from "../components/common/ProgressBar.vue";
import { useMesStore } from "../stores/mes";

const mesStore = useMesStore();
const { dataState } = storeToRefs(mesStore);

const filteredFactories = computed(() =>
  dataState.value.factories.filter(
    (item) => mesStore.factoryFilter === "all" || item.name === mesStore.factoryFilter
  )
);
</script>

<template>
  <section class="page-grid">
    <div class="card">
      <div class="card-head">
        <div>
          <h3 class="card-title">生产配置</h3>
          <p class="card-subtitle">管理工厂、产线、工位、班次和产能配置</p>
        </div>

        <div class="filter-bar">
          <label class="inline-field">
            <select :value="mesStore.factoryFilter" @change="mesStore.factoryFilter = $event.target.value">
              <option value="all">全部工厂</option>
              <option v-for="factory in dataState.factories" :key="factory.code || factory.name" :value="factory.name">
                {{ factory.name }}
              </option>
            </select>
          </label>
        </div>
      </div>

      <div class="card-body">
        <div class="plant-grid">
          <article v-for="factory in filteredFactories" :key="factory.code || factory.name" class="info-panel">
            <h4>{{ factory.name }}</h4>
            <p>{{ factory.shift }}，当前配置 {{ factory.lines }} 条产线、{{ factory.stations }} 个工位，单日产能 {{ factory.capacity }}。</p>
            <div class="metric-line"><span>OEE</span><strong>{{ factory.oee }}%</strong></div>
            <ProgressBar :value="factory.oee" />
            <div class="metric-line"><span>生产效率</span><strong>{{ factory.efficiency }}%</strong></div>
            <ProgressBar :value="factory.efficiency" />
            <div class="metric-line"><span>设备在线率</span><strong>{{ factory.onlineRate }}%</strong></div>
            <div class="tag-row">
              <span class="tag">产线标准化</span>
              <span class="tag">工位绑定条码</span>
              <span class="tag">班次日历</span>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>
