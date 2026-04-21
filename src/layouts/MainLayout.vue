<script setup>
import { computed } from "vue";
import { useRoute, useRouter, RouterView } from "vue-router";
import { storeToRefs } from "pinia";
import AppHeader from "../components/layout/AppHeader.vue";
import AppSidebar from "../components/layout/AppSidebar.vue";
import { useMesStore } from "../stores/mes";

const route = useRoute();
const router = useRouter();
const mesStore = useMesStore();

const { user, currentTime, sidebarCollapsed, accessibleModules, shellStats, dataState } = storeToRefs(mesStore);

const currentItem = computed(() => {
  return mesStore.getRouteItem(route.name) || mesStore.getRouteItem(mesStore.defaultRouteName);
});

const activeParentKey = computed(() => currentItem.value?.parentKey || currentItem.value?.key || "");

const pageTitle = computed(() => currentItem.value?.label || "首页");

const pageSubtitle = computed(() => {
  if (!currentItem.value) {
    return "";
  }

  if (currentItem.value.parentLabel) {
    return `${currentItem.value.section} / ${currentItem.value.parentLabel} / ${currentItem.value.description}`;
  }

  return `${currentItem.value.section} / ${currentItem.value.description}`;
});

const notificationItems = computed(() => {
  const pendingApprovals = (dataState.value.approvals || [])
    .filter((item) => !String(item.status || "").includes("已"))
    .slice(0, 2)
    .map((item) => ({
      id: `approval-${item.id}`,
      category: "审批待办",
      title: item.title,
      detail: `${item.applicant} · ${item.time}`,
      routeName: "approval"
    }));

  const activeExceptions = (dataState.value.exceptions || [])
    .filter((item) => !String(item.status || "").includes("已"))
    .slice(0, 2)
    .map((item) => ({
      id: `exception-${item.id}`,
      category: "异常提醒",
      title: item.type,
      detail: `${item.station} · ${item.time}`,
      routeName: "dashboard"
    }));

  const alarmEquipment = (dataState.value.equipment || [])
    .filter((item) => Number(item.alarm || 0) > 0)
    .slice(0, 2)
    .map((item) => ({
      id: `equipment-${item.id}`,
      category: "设备告警",
      title: item.name,
      detail: `${item.area} · 告警 ${item.alarm} 条`,
      routeName: "equipment"
    }));

  return [...pendingApprovals, ...activeExceptions, ...alarmEquipment];
});

const notificationCount = computed(() => {
  const pendingApprovals = (dataState.value.approvals || []).filter((item) => !String(item.status || "").includes("已")).length;
  return pendingApprovals + shellStats.value.pendingExceptionsCount + shellStats.value.equipmentAlarmCount;
});

function navigate(routeName) {
  if (mesStore.isModuleAccessible(routeName)) {
    router.push({ name: routeName });
  }
}

async function handleLogout() {
  await mesStore.logout();
  router.replace({ name: "login" });
}
</script>

<template>
  <div class="shell" :class="{ collapsed: sidebarCollapsed }">
    <AppSidebar
      :modules="accessibleModules"
      :active-route-name="String(route.name || '')"
      :active-parent-key="activeParentKey"
      :online-orders="shellStats.onlineOrders"
      :equipment-alarm-count="shellStats.equipmentAlarmCount"
      :pending-exceptions-count="shellStats.pendingExceptionsCount"
      @navigate="navigate"
    />

    <div class="main">
      <AppHeader
        :title="pageTitle"
        :subtitle="pageSubtitle"
        :current-time="currentTime"
        :user="user"
        :notification-count="notificationCount"
        :notifications="notificationItems"
        @toggle-sidebar="mesStore.toggleSidebar"
        @navigate="navigate"
        @logout="handleLogout"
      />

      <main class="content">
        <RouterView />
        <div class="footer-note">MES 制造执行系统 Vue 3 工程版 · 覆盖计划、执行、质量、设备、仓储、追溯与审批协同</div>
      </main>
    </div>
  </div>
</template>
