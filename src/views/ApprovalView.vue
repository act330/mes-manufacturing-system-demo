<script setup>
import { storeToRefs } from "pinia";
import StatusPill from "../components/common/StatusPill.vue";
import { useMesStore } from "../stores/mes";
import { approvalStatusType } from "../utils/mes-utils";

const mesStore = useMesStore();
const { dataState, canDecideApproval } = storeToRefs(mesStore);
</script>

<template>
  <section class="page-grid">
    <div class="hero-strip">
      <p class="eyebrow">Workflow Center</p>
      <h3>工单变更、设备延期、让步接收等流程统一走审批</h3>
      <p>审批操作现在由 Vue Router 页面 + Pinia + Axios 统一驱动，页面状态会自动响应更新。</p>
    </div>

    <div class="approval-grid">
      <article v-for="item in dataState.approvals" :key="item.id" class="approval-card">
        <h4>{{ item.title }}</h4>
        <p>{{ item.reason }}</p>
        <div class="approval-meta">
          <span class="tag">{{ item.id }}</span>
          <span class="tag">{{ item.applicant }} / {{ item.dept }}</span>
          <span class="tag">{{ item.time }}</span>
        </div>
        <div class="metric-line">
          <span>当前状态</span>
          <StatusPill :label="item.status" :type="approvalStatusType(item.status)" />
        </div>
        <div class="hero-actions">
          <button
            class="btn btn-primary btn-sm"
            type="button"
            :disabled="item.status !== '待审批' || !canDecideApproval"
            @click="mesStore.decideApproval(item.id, 'approved')"
          >
            通过
          </button>
          <button
            class="btn btn-secondary btn-sm"
            type="button"
            :disabled="item.status !== '待审批' || !canDecideApproval"
            @click="mesStore.decideApproval(item.id, 'rejected')"
          >
            驳回
          </button>
        </div>
      </article>
    </div>
  </section>
</template>
