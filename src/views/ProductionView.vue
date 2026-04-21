<script setup>
import { storeToRefs } from "pinia";
import ProgressBar from "../components/common/ProgressBar.vue";
import StatusPill from "../components/common/StatusPill.vue";
import { useMesStore } from "../stores/mes";
import { priorityType, productionStatusType } from "../utils/mes-utils";

const mesStore = useMesStore();
const { filteredWorkOrders } = storeToRefs(mesStore);

function completionRate(item) {
  return Math.round((Number(item.produced || 0) / Number(item.planned || 1)) * 100);
}
</script>

<template>
  <section class="page-grid">
    <div class="card">
      <div class="card-head">
        <div>
          <h3 class="card-title">生产管理</h3>
          <p class="card-subtitle">按工单维度管理排产、报工、节拍、良率和异常响应</p>
        </div>
        <div class="filter-bar">
          <label class="inline-field" style="max-width:220px;">
            <select :value="mesStore.productionStatus" @change="mesStore.productionStatus = $event.target.value">
              <option value="all">全部状态</option>
              <option value="running">进行中</option>
              <option value="finishing">收尾中</option>
              <option value="completed">已完成</option>
              <option value="abnormal">异常中</option>
            </select>
          </label>
        </div>
      </div>
      <div class="card-body table-scroll">
        <table>
          <thead>
            <tr>
              <th>工单号</th>
              <th>产品名称</th>
              <th>产线</th>
              <th>计划数量</th>
              <th>已生产</th>
              <th>完成率</th>
              <th>合格率</th>
              <th>优先级</th>
              <th>状态</th>
              <th>负责人</th>
              <th>交期</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredWorkOrders" :key="item.id">
              <td>{{ item.id }}</td>
              <td>{{ item.product }}</td>
              <td>{{ item.line }}</td>
              <td>{{ item.planned }}</td>
              <td>{{ item.produced }}</td>
              <td style="min-width:160px;">
                <ProgressBar :value="completionRate(item)" />
                <div class="muted" style="margin-top:8px;">{{ completionRate(item) }}%</div>
              </td>
              <td>{{ item.passRate }}%</td>
              <td><StatusPill :label="item.priority" :type="priorityType(item.priority)" /></td>
              <td><StatusPill :label="item.status" :type="productionStatusType(item.status)" /></td>
              <td>{{ item.manager }}</td>
              <td>{{ item.due }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </section>
</template>
