<script setup>
import { useRouter, useRoute } from "vue-router";
import { storeToRefs } from "pinia";
import LoginPage from "../components/layout/LoginPage.vue";
import { useMesStore } from "../stores/mes";

const router = useRouter();
const route = useRoute();
const mesStore = useMesStore();

const { loginForm, passwordVisible, currentTime, loading, dataState } = storeToRefs(mesStore);

async function handleSubmit() {
  const success = await mesStore.submitLogin();

  if (!success) {
    return;
  }

  const redirect = typeof route.query.redirect === "string" ? route.query.redirect : null;
  if (redirect) {
    router.replace(redirect);
    return;
  }

  router.replace({ name: mesStore.defaultRouteName });
}
</script>

<template>
  <LoginPage
    :form="loginForm"
    :factories="dataState.factories"
    :password-visible="passwordVisible"
    :live-clock="currentTime"
    :loading="loading"
    @submit="handleSubmit"
    @toggle-password="mesStore.togglePassword"
    @fill-demo="mesStore.fillDemoAccount"
  />
</template>
