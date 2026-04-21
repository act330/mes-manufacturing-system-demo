<script setup>
import { onMounted } from "vue";
import { storeToRefs } from "pinia";
import { RouterView } from "vue-router";
import AppToast from "./components/common/AppToast.vue";
import AppClipboardNotice from "./components/common/AppClipboardNotice.vue";
import { useMesStore } from "./stores/mes";

const mesStore = useMesStore();
const { toast, clipboardNotice } = storeToRefs(mesStore);

onMounted(() => {
  mesStore.initApp();
});
</script>

<template>
  <div class="app-shell">
    <AppToast v-if="toast" :message="toast" />
    <AppClipboardNotice
      v-if="clipboardNotice"
      :title="clipboardNotice.title"
      :detail="clipboardNotice.detail"
    />
    <RouterView />
  </div>
</template>
