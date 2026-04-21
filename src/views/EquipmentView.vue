<script setup>
import { storeToRefs } from "pinia";
import ProgressBar from "../components/common/ProgressBar.vue";
import StatusPill from "../components/common/StatusPill.vue";
import { useMesStore } from "../stores/mes";
import { equipmentStatusType } from "../utils/mes-utils";

const mesStore = useMesStore();
const { dataState } = storeToRefs(mesStore);
</script>

<template>
  <section class="page-grid">
    <div class="device-grid">
      <article v-for="item in dataState.equipment" :key="item.code" class="info-panel">
        <h4>{{ item.name }}</h4>
        <p>{{ item.code }} · {{ item.area }} · 负责人 {{ item.maintainer }}</p>
        <div class="metric-line"><span>状态</span><StatusPill :label="item.status" :type="equipmentStatusType(item.status)" /></div>
        <div class="metric-line"><span>OEE</span><strong>{{ item.oee }}%</strong></div>
        <ProgressBar :value="item.oee" />
        <div class="metric-line"><span>运行时长</span><strong>{{ item.runtime }}</strong></div>
        <div class="metric-line"><span>告警数</span><strong>{{ item.alarm }}</strong></div>
      </article>
    </div>
  </section>
</template>
