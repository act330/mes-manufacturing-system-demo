<script setup>
import { storeToRefs } from "pinia";
import { useMesStore } from "../stores/mes";

const mesStore = useMesStore();
const { dataState, canUpdateSettings } = storeToRefs(mesStore);
</script>

<template>
  <section class="page-grid">
    <div class="grid-2-balanced">
      <div class="card">
        <div class="card-head">
          <div>
            <h3 class="card-title">系统开关</h3>
            <p class="card-subtitle">常见 MES 自动化能力的启停控制</p>
          </div>
        </div>
        <div class="card-body">
          <div class="settings-list">
            <div v-for="item in dataState.settings" :key="item.key" class="settings-item">
              <div>
                <strong>{{ item.title }}</strong>
                <div class="muted">{{ item.desc }}</div>
              </div>
              <button
                class="switch"
                :class="{ active: item.enabled }"
                type="button"
                :disabled="!canUpdateSettings"
                :aria-label="item.title"
                @click="mesStore.toggleSetting(item.key)"
              ></button>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <h3 class="card-title">部署建议</h3>
            <p class="card-subtitle">如果继续往正式系统推进，建议优先打通这些接口</p>
          </div>
        </div>
        <div class="card-body">
          <div class="timeline">
            <div class="timeline-item">
              <strong>ERP / APS</strong>
              <small>接收销售订单、主数据、BOM、工艺路线和排产计划。</small>
            </div>
            <div class="timeline-item">
              <strong>设备采集</strong>
              <small>通过 OPC UA、Modbus、串口或厂商 SDK 采集设备状态与工艺参数。</small>
            </div>
            <div class="timeline-item">
              <strong>WMS / 质检系统</strong>
              <small>同步发料、入库、检验结果和不良闭环信息。</small>
            </div>
            <div class="timeline-item">
              <strong>权限与审计</strong>
              <small>对接企业统一账号体系，补充日志、审计、电子签名能力。</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
