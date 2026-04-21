import { createRouter, createWebHistory } from "vue-router";
import { defaultModuleRegistry, extraRouteRegistry } from "../config/modules";
import { useMesStore } from "../stores/mes";

const viewLoaders = {
  login: () => import("../views/LoginView.vue"),
  systemError: () => import("../views/SystemErrorView.vue"),
  mainLayout: () => import("../layouts/MainLayout.vue"),
  submodule: () => import("../views/SubmoduleView.vue"),
  dashboard: () => import("../views/DashboardView.vue"),
  productionConfig: () => import("../views/ProductionConfigView.vue"),
  customer: () => import("../views/CustomerView.vue"),
  process: () => import("../views/ProcessView.vue"),
  barcode: () => import("../views/BarcodeView.vue"),
  production: () => import("../views/ProductionView.vue"),
  equipment: () => import("../views/EquipmentView.vue"),
  warehouse: () => import("../views/WarehouseView.vue"),
  traceability: () => import("../views/TraceabilityView.vue"),
  reports: () => import("../views/ReportsView.vue"),
  approval: () => import("../views/ApprovalView.vue"),
  settings: () => import("../views/SettingsView.vue")
};

const topLevelRoutes = defaultModuleRegistry.map((item) => ({
  path: item.path,
  name: item.routeName,
  component: viewLoaders[item.key],
  meta: {
    permission: item.permission,
    title: item.label,
    description: item.description,
    section: item.section,
    moduleKey: item.key
  }
}));

const submoduleRoutes = defaultModuleRegistry.flatMap((item) =>
  (item.children || []).map((child) => ({
    path: `${item.path}/${child.path}`,
    name: child.routeName,
    component: viewLoaders.submodule,
    meta: {
      permission: child.permission || item.permission,
      title: child.label,
      description: child.description,
      section: item.section,
      moduleKey: item.key,
      parentKey: item.key,
      parentLabel: item.label
    }
  }))
);

const extraRoutes = extraRouteRegistry.map((item) => ({
  path: item.path,
  name: item.routeName,
  component: viewLoaders.submodule,
  meta: {
    permission: item.permission,
    title: item.label,
    description: item.description,
    section: item.section,
    moduleKey: item.parentKey,
    parentKey: item.parentKey,
    parentLabel: item.parentLabel
  }
}));

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/login",
      name: "login",
      component: viewLoaders.login,
      meta: {
        guestOnly: true,
        public: true
      }
    },
    {
      path: "/401",
      name: "unauthorized",
      component: viewLoaders.systemError,
      props: {
        code: "401",
        title: "登录状态已失效",
        description: "你的登录状态已过期、被清除或令牌无效，请重新登录后继续访问系统。",
        primaryLabel: "重新登录",
        secondaryLabel: "返回上一页"
      },
      meta: {
        public: true
      }
    },
    {
      path: "/403",
      name: "forbidden",
      component: viewLoaders.systemError,
      props: {
        code: "403",
        title: "访问被拒绝",
        description: "当前账号没有访问该页面或资源的权限，请联系管理员调整角色授权。",
        primaryLabel: "回到首页",
        secondaryLabel: "返回上一页"
      },
      meta: {
        public: true
      }
    },
    {
      path: "/404",
      name: "notFound",
      component: viewLoaders.systemError,
      props: {
        code: "404",
        title: "页面不存在",
        description: "当前访问的页面不存在、已被移动，或链接地址填写有误。",
        primaryLabel: "回到首页",
        secondaryLabel: "返回上一页"
      },
      meta: {
        public: true
      }
    },
    {
      path: "/",
      component: viewLoaders.mainLayout,
      children: [
        {
          path: "",
          redirect: {
            name: "dashboard"
          }
        },
        ...topLevelRoutes,
        ...submoduleRoutes,
        ...extraRoutes
      ]
    },
    {
      path: "/:pathMatch(.*)*",
      redirect: {
        name: "notFound"
      }
    }
  ]
});

export function setupRouterGuards(pinia) {
  router.beforeEach(async (to) => {
    const mesStore = useMesStore(pinia);

    if (!mesStore.initialized) {
      await mesStore.initApp();
    }

    if (to.meta.public) {
      if (to.meta.guestOnly && mesStore.user) {
        return {
          name: mesStore.defaultRouteName
        };
      }

      return true;
    }

    if (!mesStore.user) {
      if (mesStore.lastAuthFailure === "expired") {
        mesStore.clearAuthFailure();
        return {
          name: "unauthorized",
          query: {
            redirect: to.fullPath
          }
        };
      }

      return {
        name: "login",
        query: {
          redirect: to.fullPath
        }
      };
    }

    if (to.meta.permission && !mesStore.hasPermission(to.meta.permission)) {
      return {
        name: "forbidden",
        query: {
          from: to.fullPath
        }
      };
    }

    return true;
  });
}

export default router;
