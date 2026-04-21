import axios from "axios";
import { STORAGE_KEYS } from "../utils/mes-utils";

export const apiClient = axios.create({
  baseURL: "/api",
  headers: {
    Accept: "application/json"
  }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(STORAGE_KEYS.token);

  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let interceptorsReady = false;

export function setupApiInterceptors({ router, resolveAuthStore }) {
  if (interceptorsReady) {
    return;
  }

  apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
      const status = error?.response?.status;
      const config = error?.config || {};
      const authStore = typeof resolveAuthStore === "function" ? resolveAuthStore() : null;
      const currentRoute = router?.currentRoute?.value;

      if (status === 401 && !config.skipAuthRedirect) {
        authStore?.handleUnauthorized(getApiErrorMessage(error, "登录已失效，请重新登录。"));

        if (router && currentRoute?.name !== "unauthorized") {
          await router.replace({
            name: "unauthorized",
            query: {
              redirect: currentRoute?.fullPath || "/"
            }
          });
        }
      }

      if (status === 403 && !config.skipPermissionRedirect) {
        authStore?.setToast(getApiErrorMessage(error, "当前账号没有访问权限。"));

        if (router && currentRoute?.name !== "forbidden") {
          await router.replace({
            name: "forbidden",
            query: {
              from: currentRoute?.fullPath || "/"
            }
          });
        }
      }

      return Promise.reject(error);
    }
  );

  interceptorsReady = true;
}

export function getApiErrorMessage(error, fallbackMessage) {
  return error?.response?.data?.error || error?.message || fallbackMessage;
}
