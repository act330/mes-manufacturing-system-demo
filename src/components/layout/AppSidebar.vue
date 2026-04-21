<script setup>
import { computed, ref, watch } from "vue";

const props = defineProps({
  modules: {
    type: Array,
    default: () => []
  },
  activeRouteName: {
    type: String,
    required: true
  },
  activeParentKey: {
    type: String,
    default: ""
  },
  onlineOrders: {
    type: Number,
    default: 0
  },
  equipmentAlarmCount: {
    type: Number,
    default: 0
  },
  pendingExceptionsCount: {
    type: Number,
    default: 0
  }
});

const emit = defineEmits(["navigate"]);

const expandedKeys = ref([]);

const sections = computed(() => [...new Set(props.modules.map((item) => item.section))]);

watch(
  () => props.activeParentKey,
  (value) => {
    if (value && !expandedKeys.value.includes(value)) {
      expandedKeys.value.push(value);
    }
  },
  { immediate: true }
);

const activeLabel = computed(() => findItemLabel(props.modules, props.activeRouteName));

function findItemLabel(modules, routeName) {
  for (const item of modules) {
    if (item.routeName === routeName) {
      return item.label;
    }

    for (const child of item.children || []) {
      if (child.routeName === routeName) {
        return child.label;
      }
    }
  }

  return "";
}

function isExpanded(moduleKey) {
  return expandedKeys.value.includes(moduleKey);
}

function toggleExpand(moduleKey) {
  if (expandedKeys.value.includes(moduleKey)) {
    expandedKeys.value = expandedKeys.value.filter((item) => item !== moduleKey);
    return;
  }

  expandedKeys.value.push(moduleKey);
}

function handleParentClick(item) {
  if (item.children?.length) {
    toggleExpand(item.key);
  }

  emit("navigate", item.routeName || item.key);
}

function handleChildClick(child) {
  emit("navigate", child.routeName || child.key);
}
</script>

<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      <div class="brand-square"></div>
      <div>
        <strong>易蓝科技 MES</strong>
        <span>制造执行系统</span>
      </div>
    </div>

    <div class="sidebar-search">
      <label class="search-pill">
        <span>⌕</span>
        <input type="text" readonly placeholder="搜索模块" :value="activeLabel" />
      </label>
    </div>

    <section v-for="section in sections" :key="section" class="menu-section">
      <div class="menu-section-title">{{ section }}</div>
      <div class="menu-list">
        <div v-for="item in modules.filter((moduleItem) => moduleItem.section === section)" :key="item.key" class="menu-group">
          <button
            class="menu-button"
            :class="{ active: item.key === activeParentKey }"
            type="button"
            @click="handleParentClick(item)"
          >
            <span class="menu-icon"></span>
            <span class="menu-label">{{ item.label }}</span>
            <span v-if="item.children?.length" class="menu-arrow" :class="{ expanded: isExpanded(item.key) }">⌄</span>
          </button>

          <div v-if="item.children?.length && isExpanded(item.key)" class="submenu-list">
            <button
              v-for="child in item.children"
              :key="child.key"
              class="submenu-button"
              :class="{ active: child.routeName === activeRouteName }"
              type="button"
              @click.stop="handleChildClick(child)"
            >
              <span class="submenu-dot"></span>
              <span>{{ child.label }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <div class="sidebar-footer">
      <strong>今日概况</strong>
      <p>在线工单 {{ onlineOrders }} 单，设备告警 {{ equipmentAlarmCount }} 台，异常待处理 {{ pendingExceptionsCount }} 条。</p>
    </div>
  </aside>
</template>
