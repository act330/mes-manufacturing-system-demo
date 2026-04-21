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

const { user, currentTime, sidebarCollapsed, accessibleModules, shellStats } = storeToRefs(mesStore);

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
        @toggle-sidebar="mesStore.toggleSidebar"
        @logout="handleLogout"
      />

      <main class="content">
        <RouterView />
        <div class="footer-note">MES 制造执行系统 Vue 3 工程版 · 覆盖计划、执行、质量、设备、仓储、追溯与审批协同</div>
      </main>
    </div>
  </div>
</template>
