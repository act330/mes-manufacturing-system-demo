<script setup>
defineProps({
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
  }
});

const emit = defineEmits(["toggle-sidebar", "logout"]);
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

      <button class="icon-button" type="button" title="通知中心">
        <span class="bell"></span>
      </button>

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
