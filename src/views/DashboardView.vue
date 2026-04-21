<script setup>
import { useRouter } from "vue-router";
import { storeToRefs } from "pinia";
import LineTrendChart from "../components/charts/LineTrendChart.vue";
import DefectDonut from "../components/charts/DefectDonut.vue";
import StatusPill from "../components/common/StatusPill.vue";
import ProgressBar from "../components/common/ProgressBar.vue";
import { useMesStore } from "../stores/mes";
import { exceptionStatusType, priorityType, productionStatusType } from "../utils/mes-utils";

const router = useRouter();
const mesStore = useMesStore();
const { dashboardSummary, dataState } = storeToRefs(mesStore);

function completionRate(item) {
  return Math.round((Number(item.produced || 0) / Number(item.planned || 1)) * 100);
}

function navigate(moduleKey) {
  router.push({ name: moduleKey });
}
</script>

<template>
  <section class="page-grid">
    <div class="hero-strip">
      <p class="eyebrow">Factory Overview</p>
      <h3>以工单为主线，实时掌控现场节拍、良率、设备与异常闭环</h3>
      <p>当前版本已经升级为 Vue 3 单页应用，看板、工单、追溯和审批都由响应式状态和 API 数据驱动。</p>
      <div class="hero-actions">
        <button class="btn btn-primary btn-sm" type="button" @click="navigate('production')">查看工单执行</button>
        <button class="btn btn-secondary btn-sm" type="button" @click="navigate('traceability')">查看履历追溯</button>
        <button class="btn btn-ghost btn-sm" type="button" @click="navigate('reports')">查看统计报表</button>
      </div>
    </div>

    <div class="dashboard-stats">
      <div class="stat-card">
        <span class="stat-kicker">工单总数</span>
        <strong>{{ dashboardSummary.totalOrders }}</strong>
        <p>覆盖 SMT、装配、测试、包装等制程</p>
        <div class="stat-trend trend-up">较昨日 +2 单</div>
      </div>
      <div class="stat-card">
        <span class="stat-kicker">在线工单</span>
        <strong>{{ dashboardSummary.onlineOrders }}</strong>
        <p>重点关注高优先级和异常风险工单</p>
        <div class="stat-trend trend-up">节拍稳定</div>
      </div>
      <div class="stat-card">
        <span class="stat-kicker">完工工单</span>
        <strong>{{ dashboardSummary.finishedOrders }}</strong>
        <p>当前已入库并完成报工结案的工单</p>
        <div class="stat-trend trend-up">达成率稳定</div>
      </div>
      <div class="stat-card">
        <span class="stat-kicker">异常工单</span>
        <strong>{{ dashboardSummary.abnormalOrders }}</strong>
        <p>需要设备、质量或工艺部门协同处理</p>
        <div class="stat-trend" :class="dashboardSummary.abnormalOrders > 0 ? 'trend-warn' : 'trend-up'">
          {{ dashboardSummary.abnormalOrders > 0 ? "请优先闭环" : "全部正常" }}
        </div>
      </div>
    </div>

    <div class="card">
      <div class="card-head">
        <div>
          <h3 class="card-title">生产数据</h3>
          <p class="card-subtitle">汇总工单、产量、在线工位和质量关键指标</p>
        </div>
      </div>
      <div class="card-body">
        <div class="data-strip">
          <div class="data-chip">
            <strong>{{ dashboardSummary.totalPlanned.toLocaleString() }}</strong>
            <span>计划总数量</span>
          </div>
          <div class="data-chip">
            <strong>{{ dashboardSummary.totalProduced.toLocaleString() }}</strong>
            <span>累计已生产</span>
          </div>
          <div class="data-chip">
            <strong>{{ dashboardSummary.avgPassRate }}%</strong>
            <span>平均合格率</span>
          </div>
          <div class="data-chip">
            <strong>{{ dataState.exceptions.length }}</strong>
            <span>异常记录数</span>
          </div>
        </div>
      </div>
    </div>

    <div class="grid-2">
      <div class="card chart-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">近一年产量及合格率</h3>
            <p class="card-subtitle">月产出趋势与综合良率同步跟踪</p>
          </div>
          <span class="pill info">产量单位：万件</span>
        </div>
        <div class="card-body">
          <div class="chart-wrap">
            <LineTrendChart :data="dataState.monthlyTrend" />
          </div>
          <div class="chart-legend">
            <div class="legend-item"><span class="legend-line" style="background:#2f80ff;"></span>产量</div>
            <div class="legend-item"><span class="legend-line" style="background:#22c2c8;"></span>合格率</div>
          </div>
        </div>
      </div>

      <div class="card chart-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">生产不良 TOP</h3>
            <p class="card-subtitle">按缺陷类型聚合现场异常</p>
          </div>
          <span class="pill warning">本周共 94 件</span>
        </div>
        <div class="card-body">
          <DefectDonut :items="dataState.defectTop" />
        </div>
      </div>
    </div>

    <div class="grid-2-balanced">
      <div class="card table-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">工单生产进度</h3>
            <p class="card-subtitle">计划量、已产出和合格率一屏追踪</p>
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
                <th>交期</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in dataState.workOrders" :key="item.id">
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
                <td>{{ item.due }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card table-card">
        <div class="card-head">
          <div>
            <h3 class="card-title">异常处理</h3>
            <p class="card-subtitle">异常类型、工位、责任人与状态流转</p>
          </div>
        </div>
        <div class="card-body table-scroll">
          <table>
            <thead>
              <tr>
                <th>异常类型</th>
                <th>工位</th>
                <th>责任人</th>
                <th>异常状态</th>
                <th>创建时间</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in dataState.exceptions" :key="item.id || item.time">
                <td>{{ item.type }}</td>
                <td>{{ item.station }}</td>
                <td>{{ item.owner }}</td>
                <td><StatusPill :label="item.status" :type="exceptionStatusType(item.status)" /></td>
                <td>{{ item.time }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </section>
</template>
