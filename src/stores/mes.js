import { defineStore } from "pinia";
import {
  defaultModuleRegistry,
  filterModulesByPermissions,
  findExtraRouteByName,
  findModuleByRouteName,
  flattenModuleRegistry
} from "../config/modules";
import { defaultData } from "../data/default-data";
import { apiClient, getApiErrorMessage } from "../services/api";
import {
  demoDecideApproval,
  demoHydrateSession,
  demoLogin,
  demoSearchTrace,
  demoToggleSetting,
  isStaticDemoMode
} from "../services/static-demo";
import {
  STORAGE_KEYS,
  deepClone,
  filterWorkOrdersByStatus,
  formatDateTime,
  getEquipmentAlarmCount,
  getOnlineOrders,
  getPendingExceptionsCount,
  matchTrace
} from "../utils/mes-utils";

let toastTimer = 0;
let clipboardNoticeTimer = 0;
let clockTimer = 0;

export const useMesStore = defineStore("mes", {
  state: () => ({
    initialized: false,
    user: loadStoredUser(),
    authToken: loadStoredToken(),
    cachedAccessibleModules: loadStoredMenuCache(),
    lastAuthFailure: "",
    remember: localStorage.getItem(STORAGE_KEYS.remember) === "1",
    passwordVisible: false,
    sidebarCollapsed: localStorage.getItem(STORAGE_KEYS.sidebar) === "1",
    toast: "",
    clipboardNotice: null,
    loading: false,
    currentTime: formatDateTime(new Date()),
    factoryFilter: "all",
    customerQuery: "",
    productionStatus: "all",
    traceQuery: "LOT-240418-03",
    traceResult: null,
    loginForm: {
      username: "admin",
      password: "123456",
      factory: "FAC-001",
      remember: true
    },
    modules: deepClone(defaultModuleRegistry),
    dataState: deepClone(defaultData)
  }),
  getters: {
    accessibleModules(state) {
      if (!state.user || !Array.isArray(state.user.permissions)) {
        return [];
      }

      if (Array.isArray(state.cachedAccessibleModules) && state.cachedAccessibleModules.length) {
        return state.cachedAccessibleModules;
      }

      return filterModulesByPermissions(state.modules, state.user.permissions);
    },
    flatAccessibleItems() {
      return flattenModuleRegistry(this.accessibleModules);
    },
    defaultRouteName() {
      return this.accessibleModules[0]?.routeName || "dashboard";
    },
    dashboardSummary(state) {
      const totalOrders = state.dataState.workOrders.length;
      const onlineOrders = getOnlineOrders(state.dataState.workOrders).length;
      const finishedOrders = state.dataState.workOrders.filter((item) => item.status === "已完成").length;
      const abnormalOrders = state.dataState.workOrders.filter((item) => item.status === "异常中").length;
      const totalPlanned = state.dataState.workOrders.reduce(
        (sum, item) => sum + Number(item.planned || 0),
        0
      );
      const totalProduced = state.dataState.workOrders.reduce(
        (sum, item) => sum + Number(item.produced || 0),
        0
      );
      const avgPassRate =
        state.dataState.workOrders.reduce((sum, item) => sum + Number(item.passRate || 0), 0) /
        (state.dataState.workOrders.length || 1);

      return {
        totalOrders,
        onlineOrders,
        finishedOrders,
        abnormalOrders,
        totalPlanned,
        totalProduced,
        avgPassRate: Number(avgPassRate.toFixed(1))
      };
    },
    filteredCustomers(state) {
      const query = state.customerQuery.trim().toLowerCase();

      if (!query) {
        return state.dataState.customers;
      }

      return state.dataState.customers.filter((item) =>
        [item.name, item.code, item.region, item.owner].some((part) =>
          String(part || "")
            .toLowerCase()
            .includes(query)
        )
      );
    },
    filteredWorkOrders(state) {
      return filterWorkOrdersByStatus(state.dataState.workOrders, state.productionStatus);
    },
    traceLookupResult(state) {
      if (state.traceResult && matchTrace(state.traceResult, state.traceQuery)) {
        return state.traceResult;
      }

      return state.dataState.traceLots.find((item) => matchTrace(item, state.traceQuery)) || null;
    },
    shellStats(state) {
      return {
        onlineOrders: getOnlineOrders(state.dataState.workOrders).length,
        equipmentAlarmCount: getEquipmentAlarmCount(state.dataState.equipment),
        pendingExceptionsCount: getPendingExceptionsCount(state.dataState.exceptions)
      };
    },
    canDecideApproval() {
      return this.hasPermission("approval:decision");
    },
    canUpdateSettings() {
      return this.hasPermission("settings:update");
    }
  },
  actions: {
    initLoginForm() {
      this.loginForm.remember = this.remember;
    },
    async initApp() {
      if (this.initialized) {
        return;
      }

      this.initialized = true;
      this.startClock();
      this.initLoginForm();
      await this.hydrateSession();
    },
    startClock() {
      if (clockTimer) {
        return;
      }

      this.currentTime = formatDateTime(new Date());
      clockTimer = window.setInterval(() => {
        this.currentTime = formatDateTime(new Date());
      }, 1000);
    },
    setToast(message) {
      this.toast = message;

      if (toastTimer) {
        window.clearTimeout(toastTimer);
      }

      toastTimer = window.setTimeout(() => {
        this.toast = "";
      }, 3200);
    },
    setClipboardNotice(detail, title = "链接已复制") {
      this.clipboardNotice = {
        title,
        detail
      };

      if (clipboardNoticeTimer) {
        window.clearTimeout(clipboardNoticeTimer);
      }

      clipboardNoticeTimer = window.setTimeout(() => {
        this.clipboardNotice = null;
      }, 4200);
    },
    clearClipboardNotice() {
      this.clipboardNotice = null;
      if (clipboardNoticeTimer) {
        window.clearTimeout(clipboardNoticeTimer);
        clipboardNoticeTimer = 0;
      }
    },
    clearStoredAuth() {
      localStorage.removeItem(STORAGE_KEYS.user);
      localStorage.removeItem(STORAGE_KEYS.token);
      localStorage.removeItem(STORAGE_KEYS.remember);
      localStorage.removeItem(STORAGE_KEYS.menuCache);
      this.cachedAccessibleModules = [];
    },
    refreshAccessibleMenuCache() {
      if (!this.user || !Array.isArray(this.user.permissions)) {
        this.cachedAccessibleModules = [];
        localStorage.removeItem(STORAGE_KEYS.menuCache);
        return;
      }

      const filteredModules = filterModulesByPermissions(this.modules, this.user.permissions);
      this.cachedAccessibleModules = deepClone(filteredModules);
      localStorage.setItem(STORAGE_KEYS.menuCache, JSON.stringify(this.cachedAccessibleModules));
    },
    clearAuthFailure() {
      this.lastAuthFailure = "";
    },
    persistAuth() {
      if (!isStaticDemoMode()) {
        localStorage.removeItem(STORAGE_KEYS.user);
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.setItem(STORAGE_KEYS.remember, this.remember ? "1" : "0");
        this.refreshAccessibleMenuCache();
        return;
      }

      if (this.user && this.remember) {
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(this.user));
        localStorage.setItem(STORAGE_KEYS.token, this.authToken || "");
        localStorage.setItem(STORAGE_KEYS.remember, "1");
        this.refreshAccessibleMenuCache();
        return;
      }

      if (this.user) {
        localStorage.removeItem(STORAGE_KEYS.user);
        localStorage.removeItem(STORAGE_KEYS.token);
        localStorage.setItem(STORAGE_KEYS.remember, "0");
        this.refreshAccessibleMenuCache();
        return;
      }

      this.clearStoredAuth();
    },
    hasPermission(permissionCode) {
      if (!permissionCode) {
        return true;
      }

      return Boolean(
        this.user && Array.isArray(this.user.permissions) && this.user.permissions.includes(permissionCode)
      );
    },
    isModuleAccessible(routeNameOrKey) {
      const target = flattenModuleRegistry(this.accessibleModules).find(
        (item) => item.routeName === routeNameOrKey || item.key === routeNameOrKey
      );
      if (!target) {
        return false;
      }

      return this.hasPermission(target.permission);
    },
    getRouteItem(routeName) {
      return (
        findModuleByRouteName(this.accessibleModules, routeName) ||
        findModuleByRouteName(this.modules, routeName) ||
        findExtraRouteByName(routeName)
      );
    },
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
      localStorage.setItem(STORAGE_KEYS.sidebar, this.sidebarCollapsed ? "1" : "0");
    },
    togglePassword() {
      this.passwordVisible = !this.passwordVisible;
    },
    fillDemoAccount() {
      this.loginForm.username = "admin";
      this.loginForm.password = "123456";
      this.loginForm.factory = "FAC-001";
      this.loginForm.remember = true;
    },
    syncBootstrapData(payloadData = {}) {
      if (
        Array.isArray(payloadData.moduleRegistry) &&
        payloadData.moduleRegistry.some((item) => Array.isArray(item.children))
      ) {
        this.modules = deepClone(payloadData.moduleRegistry);
        this.refreshAccessibleMenuCache();
      }

      [
        "factories",
        "customers",
        "processRoutes",
        "barcodeRules",
        "workOrders",
        "defectTop",
        "exceptions",
        "equipment",
        "inventory",
        "traceLots",
        "approvals",
        "weeklyOutput",
        "monthlyTrend",
        "settings"
      ].forEach((key) => {
        if (Object.hasOwn(payloadData, key)) {
          this.dataState[key] = deepClone(payloadData[key]);
        }
      });
    },
    applyAuthPayload(payload) {
      this.lastAuthFailure = "";
      this.user = payload.user ? { ...payload.user } : null;
      if (payload.data) {
        this.syncBootstrapData(payload.data);
      }
      this.refreshAccessibleMenuCache();
      this.persistAuth();
    },
    clearAuthState({ silent = false } = {}) {
      this.user = null;
      this.authToken = "";
      this.passwordVisible = false;
      this.cachedAccessibleModules = [];
      this.clearStoredAuth();
      if (!silent) {
        this.setToast("登录状态已清除。");
      }
    },
    handleUnauthorized(message = "登录已失效，请重新登录。") {
      this.lastAuthFailure = "expired";
      this.clearAuthState({ silent: true });
      this.setToast(message);
    },
    async hydrateSession() {
      if (isStaticDemoMode()) {
        if (!this.authToken) {
          this.lastAuthFailure = "";
          return false;
        }

        const payload = demoHydrateSession(this.authToken, this.dataState);
        if (!payload) {
          this.lastAuthFailure = "expired";
          this.clearAuthState({ silent: true });
          return false;
        }

        this.applyAuthPayload(payload);
        return true;
      }

      try {
        const { data } = await apiClient.get("/auth/me", {
          skipAuthRedirect: true
        });
        this.applyAuthPayload(data);
        return true;
      } catch (error) {
        this.lastAuthFailure = "expired";
        this.clearAuthState({ silent: true });
        return false;
      }
    },
    async submitLogin() {
      this.loading = true;
      this.remember = this.loginForm.remember;

      try {
        if (isStaticDemoMode()) {
          const data = demoLogin({
            username: this.loginForm.username,
            password: this.loginForm.password,
            factory: this.loginForm.factory
          }, this.dataState);

          if (!data) {
            throw new Error("账号、密码或工厂不正确，请使用演示账号：admin / 123456 / FAC-001");
          }

          this.authToken = data.token;
          this.applyAuthPayload(data);
          this.setToast(`欢迎回来，${data.user.name}。当前为 GitHub Pages 静态演示模式。`);
          return true;
        }

        const { data } = await apiClient.post("/auth/login", {
          username: this.loginForm.username,
          password: this.loginForm.password,
          factory: this.loginForm.factory
        }, {
          skipAuthRedirect: true
        });

        this.authToken = "";
        this.applyAuthPayload(data);
        this.setToast(`欢迎回来，${data.user.name}。MES Vue 版本已接入 Router + Pinia + Axios。`);
        return true;
      } catch (error) {
        this.setToast(
          getApiErrorMessage(
            error,
            "账号、密码或工厂不正确，请使用演示账号：admin / 123456 / FAC-001"
          )
        );
        return false;
      } finally {
        this.loading = false;
      }
    },
    async logout() {
      if (isStaticDemoMode()) {
        this.clearAuthState({ silent: true });
        this.setToast("已安全退出系统。");
        return;
      }

      try {
        await apiClient.post("/auth/logout", null, {
          skipAuthRedirect: true
        });
      } catch (error) {
      }

      this.clearAuthState({ silent: true });
      this.setToast("已安全退出系统。");
    },
    async submitTraceSearch() {
      if (isStaticDemoMode()) {
        const data = demoSearchTrace(this.dataState, this.traceQuery);
        this.traceResult = data.item || null;
        if (!data.item) {
          this.setToast("没有查到对应履历，请确认 SN、批次号或工单号。");
        }
        return;
      }

      try {
        const { data } = await apiClient.get("/traceability/search", {
          params: {
            q: this.traceQuery
          }
        });

        this.traceResult = data.item || null;
        if (!data.item) {
          this.setToast("没有查到对应履历，请确认 SN、批次号或工单号。");
        }
      } catch (error) {
        this.setToast(getApiErrorMessage(error, "追溯查询失败，请检查接口服务是否正常。"));
      }
    },
    async decideApproval(id, decision) {
      if (isStaticDemoMode()) {
        const data = demoDecideApproval(this.dataState, id, decision);
        if (!data) {
          this.setToast("审批单不存在。");
          return;
        }

        this.dataState.approvals = data.items;
        this.setToast(`${data.item.title}${decision === "approved" ? "已审批通过" : "已驳回"}。`);
        return;
      }

      try {
        const { data } = await apiClient.post(`/approvals/${id}/decision`, { decision });
        this.dataState.approvals = deepClone(data.items || this.dataState.approvals);
        this.setToast(`${data.item.title}${decision === "approved" ? "已审批通过" : "已驳回"}。`);
      } catch (error) {
        this.setToast(getApiErrorMessage(error, "审批操作失败，请检查当前账号权限。"));
      }
    },
    async toggleSetting(key) {
      if (isStaticDemoMode()) {
        const data = demoToggleSetting(this.dataState, key);
        if (!data) {
          this.setToast("未找到对应设置项。");
          return;
        }

        this.dataState.settings = data.items;
        this.setToast(`${data.item.title}${data.item.enabled ? "已开启" : "已关闭"}。`);
        return;
      }

      try {
        const { data } = await apiClient.patch(`/settings/${key}/toggle`);
        this.dataState.settings = deepClone(data.items || this.dataState.settings);
      } catch (error) {
        this.setToast(getApiErrorMessage(error, "设置切换失败，请检查当前账号权限。"));
      }
    }
  }
});

function loadStoredUser() {
  if (!isStaticDemoMode()) {
    return null;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.user);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
}

function loadStoredToken() {
  if (!isStaticDemoMode()) {
    return "";
  }

  return localStorage.getItem(STORAGE_KEYS.token) || "";
}

function loadStoredMenuCache() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.menuCache);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}
