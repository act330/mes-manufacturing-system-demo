<script setup>
import { storeToRefs } from "pinia";
import { useMesStore } from "../stores/mes";

const mesStore = useMesStore();
const { dataState } = storeToRefs(mesStore);
</script>

<template>
  <section class="page-grid">
    <div class="grid-2-balanced">
      <div class="card table-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">条码规则管理</h3>
            <p class="card-subtitle">整机 SN、箱码、工位追溯码统一编码</p>
          </div>
        </div>
        <div class="card-body table-scroll">
          <table>
            <thead>
              <tr>
                <th>规则名称</th>
                <th>样例</th>
                <th>打印机</th>
                <th>排队数</th>
                <th>成功率</th>
                <th>最后同步</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in dataState.barcodeRules" :key="item.id || item.rule">
                <td>{{ item.rule }}</td>
                <td>{{ item.sample }}</td>
                <td>{{ item.printer }}</td>
                <td>{{ item.queue }}</td>
                <td>{{ item.success }}</td>
                <td>{{ item.lastSync }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <h3 class="card-title">条码执行成效</h3>
            <p class="card-subtitle">赋码、扫描和追溯一致性监控</p>
          </div>
        </div>
        <div class="card-body">
          <div class="metric-stack">
            <div class="metric-box">
              <strong>12,460</strong>
              <span>今日赋码数量</span>
            </div>
            <div class="metric-box">
              <strong>99.3%</strong>
              <span>扫描成功率</span>
            </div>
            <div class="metric-box">
              <strong>0.6%</strong>
              <span>重复码拦截率</span>
            </div>
            <div class="metric-box">
              <strong>全流程</strong>
              <span>单件级履历串联能力</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
