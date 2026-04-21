<script setup>
import { computed } from "vue";
import { storeToRefs } from "pinia";
import StatusPill from "../components/common/StatusPill.vue";
import { useMesStore } from "../stores/mes";
import { customerLevelType } from "../utils/mes-utils";

const mesStore = useMesStore();
const { filteredCustomers } = storeToRefs(mesStore);

const totalOrders = computed(() =>
  filteredCustomers.value.reduce((sum, item) => sum + Number(item.activeOrders || 0), 0)
);

const averageSatisfaction = computed(() => {
  if (!filteredCustomers.value.length) {
    return 0;
  }
  return (
    filteredCustomers.value.reduce((sum, item) => sum + Number(item.satisfaction || 0), 0) /
    filteredCustomers.value.length
  ).toFixed(1);
});
</script>

<template>
  <section class="page-grid">
    <div class="hero-strip">
      <p class="eyebrow">Customer Master</p>
      <h3>客户、区域、负责人和订单活跃度集中维护</h3>
      <p>这里把客户基础信息和订单活跃度放在一起，方便销售、计划和生产协同判断优先级。</p>
    </div>

    <div class="kpi-grid">
      <div class="kpi-tile">
        <span>客户总数</span>
        <strong>{{ filteredCustomers.length }}</strong>
      </div>
      <div class="kpi-tile">
        <span>活跃订单数</span>
        <strong>{{ totalOrders }}</strong>
      </div>
      <div class="kpi-tile">
        <span>平均满意度</span>
        <strong>{{ averageSatisfaction }}%</strong>
      </div>
      <div class="kpi-tile">
        <span>A 级客户</span>
        <strong>{{ filteredCustomers.filter((item) => item.level === "A").length }}</strong>
      </div>
    </div>

    <div class="card table-card">
      <div class="card-head">
        <div>
          <h3 class="card-title">客户清单</h3>
          <p class="card-subtitle">支持按客户、区域、负责人快速检索</p>
        </div>

        <label class="inline-field" style="max-width:260px;">
          <input
            :value="mesStore.customerQuery"
            type="text"
            placeholder="搜索客户/编号/区域/负责人"
            @input="mesStore.customerQuery = $event.target.value"
          />
        </label>
      </div>

      <div class="card-body table-scroll">
        <table v-if="filteredCustomers.length">
          <thead>
            <tr>
              <th>客户名称</th>
              <th>编号</th>
              <th>等级</th>
              <th>区域</th>
              <th>负责人</th>
              <th>活跃订单</th>
              <th>满意度</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredCustomers" :key="item.code">
              <td>{{ item.name }}</td>
              <td>{{ item.code }}</td>
              <td><StatusPill :label="`${item.level} 级`" :type="customerLevelType(item.level)" /></td>
              <td>{{ item.region }}</td>
              <td>{{ item.owner }}</td>
              <td>{{ item.activeOrders }}</td>
              <td>{{ item.satisfaction }}%</td>
            </tr>
          </tbody>
        </table>

        <div v-else class="empty-state">没有匹配到客户，请调整筛选条件。</div>
      </div>
    </div>
  </section>
</template>
