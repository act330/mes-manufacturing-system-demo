<script setup>
import { storeToRefs } from "pinia";
import StatusPill from "../components/common/StatusPill.vue";
import { useMesStore } from "../stores/mes";

const mesStore = useMesStore();
const { dataState } = storeToRefs(mesStore);
</script>

<template>
  <section class="page-grid">
    <div class="card table-card">
      <div class="card-head">
        <div>
          <h3 class="card-title">库存清单</h3>
          <p class="card-subtitle">实时库存、安全库存和库位信息</p>
        </div>
      </div>
      <div class="card-body table-scroll">
        <table>
          <thead>
            <tr>
              <th>物料名称</th>
              <th>料号</th>
              <th>现存量</th>
              <th>安全库存</th>
              <th>库位</th>
              <th>周转</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in dataState.inventory" :key="item.code">
              <td>{{ item.material }}</td>
              <td>{{ item.code }}</td>
              <td>{{ item.onHand }}</td>
              <td>{{ item.safety }}</td>
              <td>{{ item.location }}</td>
              <td>{{ item.turnover }}</td>
              <td>
                <StatusPill :label="item.status" :type="item.status === '预警' ? 'warning' : 'success'" />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
