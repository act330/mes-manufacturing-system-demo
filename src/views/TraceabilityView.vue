<script setup>
import { storeToRefs } from "pinia";
import { useMesStore } from "../stores/mes";

const mesStore = useMesStore();
const { traceQuery, traceLookupResult } = storeToRefs(mesStore);
</script>

<template>
  <section class="page-grid">
    <div class="card">
      <div class="card-head">
        <div>
          <h3 class="card-title">履历追溯</h3>
          <p class="card-subtitle">支持按批次号、SN、工单号反向追溯完整生产履历</p>
        </div>
      </div>
      <div class="card-body">
        <form class="filter-bar" @submit.prevent="mesStore.submitTraceSearch">
          <label class="inline-field">
            <input v-model="traceQuery" type="text" placeholder="请输入批次号、SN 或工单号" />
          </label>
          <button class="btn btn-primary btn-sm" type="submit">开始追溯</button>
        </form>

        <template v-if="traceLookupResult">
          <div class="trace-summary">
            <div class="trace-box">
              <strong>产品名称</strong>
              <div>{{ traceLookupResult.product }}</div>
            </div>
            <div class="trace-box">
              <strong>工单号</strong>
              <div>{{ traceLookupResult.orderId }}</div>
            </div>
            <div class="trace-box">
              <strong>当前结果</strong>
              <div>{{ traceLookupResult.result }}</div>
            </div>
          </div>

          <div class="card" style="margin-top:20px;">
            <div class="card-head">
              <div class="trace-header">
                <div>
                  <h3 class="card-title">{{ traceLookupResult.keyword }}</h3>
                  <p class="card-subtitle">
                    当前工位：{{ traceLookupResult.station }} · 数量：{{ traceLookupResult.qty }} · 操作人：{{ traceLookupResult.operator }}
                  </p>
                </div>
                <span class="pill info">Trace Ready</span>
              </div>
            </div>
            <div class="card-body">
              <div class="timeline">
                <div v-for="item in traceLookupResult.timeline" :key="`${traceLookupResult.keyword}-${item.time}`" class="timeline-item">
                  <strong>{{ item.time }} · {{ item.title }}</strong>
                  <small>{{ item.detail }}</small>
                </div>
              </div>
            </div>
          </div>
        </template>

        <div v-else class="empty-state">未找到对应履历，请检查批次号、SN 或工单号是否正确。</div>
      </div>
    </div>
  </section>
</template>
