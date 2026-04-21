<script setup>
import { storeToRefs } from "pinia";
import { useMesStore } from "../stores/mes";

const mesStore = useMesStore();
const { dataState } = storeToRefs(mesStore);
</script>

<template>
  <section class="page-grid">
    <div class="kpi-grid">
      <div class="kpi-tile">
        <span>本月产量</span>
        <strong>12.9 万件</strong>
      </div>
      <div class="kpi-tile">
        <span>本月良率</span>
        <strong>99.4%</strong>
      </div>
      <div class="kpi-tile">
        <span>异常闭环率</span>
        <strong>96.1%</strong>
      </div>
      <div class="kpi-tile">
        <span>订单准交率</span>
        <strong>97.8%</strong>
      </div>
    </div>

    <div class="split">
      <div class="card">
        <div class="card-head">
          <div>
            <h3 class="card-title">近七日产量</h3>
            <p class="card-subtitle">按天汇总工厂产出</p>
          </div>
        </div>
        <div class="card-body">
          <div class="bars">
            <div v-for="item in dataState.weeklyOutput" :key="item.day" class="bar-col">
              <div class="bar-shape" :style="{ height: `${Math.max(40, item.value * 18)}px` }"></div>
              <div><strong>{{ item.day }}</strong></div>
              <span class="muted">{{ item.value }} 万件</span>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-head">
          <div>
            <h3 class="card-title">报表能力</h3>
            <p class="card-subtitle">典型 MES 统计输出项目</p>
          </div>
        </div>
        <div class="card-body">
          <div class="timeline">
            <div class="timeline-item">
              <strong>生产日报</strong>
              <small>产量、良率、直通率、节拍、工时、设备稼动率。</small>
            </div>
            <div class="timeline-item">
              <strong>质量周报</strong>
              <small>不良 TOP、返修闭环、站点缺陷分布、客户抱怨关联分析。</small>
            </div>
            <div class="timeline-item">
              <strong>设备月报</strong>
              <small>OEE、停机结构、保养达成率、备件消耗趋势。</small>
            </div>
            <div class="timeline-item">
              <strong>仓储协同报表</strong>
              <small>缺料影响工单、周转天数、安全库存偏差与呆滞物料。</small>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
