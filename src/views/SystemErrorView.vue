<script setup>
import { useRoute, useRouter } from "vue-router";
import { useMesStore } from "../stores/mes";

const props = defineProps({
  code: {
    type: String,
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  primaryLabel: {
    type: String,
    required: true
  },
  secondaryLabel: {
    type: String,
    default: ""
  }
});

const route = useRoute();
const router = useRouter();
const mesStore = useMesStore();

function goPrimary() {
  if (props.code === "401") {
    router.replace({
      name: "login",
      query: typeof route.query.redirect === "string" ? { redirect: route.query.redirect } : undefined
    });
    return;
  }

  if (mesStore.user) {
    router.replace({ name: mesStore.defaultRouteName });
    return;
  }

  router.replace({ name: "login" });
}

function goSecondary() {
  if (window.history.length > 1) {
    router.back();
    return;
  }

  goPrimary();
}
</script>

<template>
  <section class="error-screen">
    <div class="error-card">
      <div class="error-code">{{ code }}</div>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>

      <div class="error-actions">
        <button class="btn btn-primary" type="button" @click="goPrimary">{{ primaryLabel }}</button>
        <button v-if="secondaryLabel" class="btn btn-ghost" type="button" @click="goSecondary">{{ secondaryLabel }}</button>
      </div>
    </div>
  </section>
</template>
