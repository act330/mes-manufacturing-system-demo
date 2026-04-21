<script setup>
import { ref } from "vue";

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  subtitle: {
    type: String,
    required: true
  },
  currentTime: {
    type: String,
    required: true
  },
  user: {
    type: Object,
    required: true
  },
  notificationCount: {
    type: Number,
    default: 0
  },
  notifications: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(["toggle-sidebar", "logout", "navigate"]);

const notificationsOpen = ref(false);

function toggleNotifications() {
  notificationsOpen.value = !notificationsOpen.value;
}

function closeNotifications() {
  notificationsOpen.value = false;
}

function handleNotificationNavigate(routeName) {
  notificationsOpen.value = false;
  if (routeName) {
    emit("navigate", routeName);
  }
}
</script>

<template>
  <header class="topbar">
    <div class="topbar-left">
      <button class="icon-button" type="button" title="折叠菜单" @click="emit('toggle-sidebar')">
        <span class="bar"></span>
      </button>
      <div class="page-title">
        <strong>{{ title }}</strong>
        <span>{{ subtitle }}</span>
      </div>
    </div>

    <div class="topbar-right">
      <div class="header-chip">
        <span class="status-ring"></span>
        MES Core Online
      </div>

      <div class="header-chip">{{ currentTime }}</div>

      <div class="notification-shell">
        <button
          class="icon-button"
          :class="{ 'icon-button--active': notificationsOpen }"
          type="button"
          title="通知中心"
          :aria-expanded="notificationsOpen"
          @click="toggleNotifications"
        >
          <span class="bell"></span>
          <span v-if="notificationCount" class="notification-badge">{{ notificationCount > 9 ? "9+" : notificationCount }}</span>
        </button>

        <div v-if="notificationsOpen" class="notification-panel">
          <div class="notification-panel-head">
            <div>
              <strong>通知中心</strong>
              <span>{{ notificationCount ? `当前有 ${notificationCount} 条待关注消息` : "当前没有待处理消息" }}</span>
            </div>
            <button class="notification-close" type="button" @click="closeNotifications">×</button>
          </div>

          <div v-if="props.notifications.length" class="notification-list">
            <button
              v-for="item in props.notifications"
              :key="item.id"
              class="notification-item"
              type="button"
              @click="handleNotificationNavigate(item.routeName)"
            >
              <span class="notification-item-tag">{{ item.category }}</span>
              <strong>{{ item.title }}</strong>
              <small>{{ item.detail }}</small>
            </button>
          </div>
          <div v-else class="notification-empty">
            所有业务消息都已处理完成，可以继续查看报表或工单执行。
          </div>
        </div>
      </div>

      <div class="user-card">
        <div class="avatar">{{ user.name.slice(0, 1) }}</div>
        <div class="user-copy">
          <strong>{{ user.name }}</strong>
          <span>{{ user.factory }} · {{ user.role }}</span>
        </div>
      </div>

      <button class="btn btn-ghost btn-sm" type="button" @click="emit('logout')">退出</button>
    </div>
  </header>
</template>
