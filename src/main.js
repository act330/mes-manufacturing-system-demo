import { createApp } from "vue";
import { createPinia } from "pinia";
import App from "./App.vue";
import router, { setupRouterGuards } from "./router";
import { setupApiInterceptors } from "./services/api";
import { useMesStore } from "./stores/mes";
import "./styles/main.css";

const app = createApp(App);
const pinia = createPinia();

setupApiInterceptors({
  router,
  resolveAuthStore: () => useMesStore(pinia)
});
setupRouterGuards(pinia);

app.use(pinia);
app.use(router);
app.mount("#app");
