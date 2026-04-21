<script setup>
defineProps({
  form: {
    type: Object,
    required: true
  },
  factories: {
    type: Array,
    default: () => []
  },
  passwordVisible: {
    type: Boolean,
    default: false
  },
  liveClock: {
    type: String,
    required: true
  },
  loading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(["submit", "toggle-password", "fill-demo"]);
</script>

<template>
  <section class="login-page">
    <div class="login-card">
      <div class="hero-panel">
        <div class="brand-row">
          <div class="brand-badge">EL</div>
          <div class="brand-copy">
            <h1>易蓝科技 MES 制造执行系统</h1>
            <p>站式数字化工厂解决方案，打通计划、执行、质量、设备、仓储与履历追溯。</p>
          </div>
        </div>

        <div class="hero-tag">Manufacturing Execution System / Real-time Operation Hub</div>

        <div class="hero-grid">
          <div class="hero-stat">
            <span>工单在线达成率</span>
            <strong>96.8%</strong>
          </div>
          <div class="hero-stat">
            <span>设备联网率</span>
            <strong>98.2%</strong>
          </div>
          <div class="hero-stat">
            <span>在制品透明度</span>
            <strong>100%</strong>
          </div>
          <div class="hero-stat">
            <span>追溯响应时间</span>
            <strong>10s</strong>
          </div>
        </div>

        <div class="factory-stage">
          <div class="floor-line line-a"></div>
          <div class="floor-line line-b"></div>
          <div class="floor-line line-c"></div>
          <div class="machine-box m1"></div>
          <div class="machine-box m2"></div>
          <div class="machine-box m3"></div>
          <div class="machine-box m4"></div>
          <div class="factory-overlay"></div>
          <div class="hero-float-card top">
            <strong>OEE 92.4%</strong>
            <span>当前工厂综合设备效率</span>
          </div>
          <div class="hero-float-card bottom">
            <strong>12 条产线在线</strong>
            <span>工单、设备、工位数据实时采集</span>
          </div>
        </div>

        <div class="hero-footer">
          <span class="tagline">数智驱动的透明工厂现场</span>
          <span>NEXGEN · ELAN SMART FACTORY</span>
        </div>
      </div>

      <div class="auth-panel">
        <div class="auth-panel-top">
          <div class="system-mark">
            <span class="spark"></span>
            Professional MES Suite
          </div>
          <span>{{ liveClock }}</span>
        </div>

        <div class="auth-card">
          <p class="eyebrow">Secure Login</p>
          <h2>欢迎进入制造现场驾驶舱</h2>
          <p class="subtitle">
            当前前端已经升级为 Vue 3 + Vite 工程，登录、看板和 MES 核心模块全部通过 API 驱动。
          </p>

          <form class="login-form" @submit.prevent="emit('submit')">
            <div class="input-group">
              <label class="input-label" for="username">用户名</label>
              <div class="field-shell">
                <span class="field-icon"></span>
                <input id="username" v-model="form.username" type="text" placeholder="请输入用户名" autocomplete="username" />
              </div>
            </div>

            <div class="input-group">
              <label class="input-label" for="password">密码</label>
              <div class="field-shell">
                <span class="field-icon"></span>
                <input
                  id="password"
                  v-model="form.password"
                  :type="passwordVisible ? 'text' : 'password'"
                  placeholder="请输入密码"
                  autocomplete="current-password"
                />
                <button class="password-toggle" type="button" @click="emit('toggle-password')">
                  {{ passwordVisible ? "隐藏" : "显示" }}
                </button>
              </div>
            </div>

            <div class="input-group">
              <label class="input-label" for="factory">工厂</label>
              <div class="field-shell">
                <span class="field-icon"></span>
                <select id="factory" v-model="form.factory">
                  <option value="">请选择工厂</option>
                  <option v-for="factory in factories" :key="factory.code || factory.name" :value="factory.code || factory.name">
                    {{ factory.name }}
                  </option>
                </select>
              </div>
            </div>

            <div class="login-actions">
              <label class="check">
                <input v-model="form.remember" type="checkbox" />
                记住密码
              </label>
              <a class="text-link" href="javascript:void(0)">忘记密码</a>
            </div>

            <button class="btn btn-primary btn-block" type="submit" :disabled="loading">
              {{ loading ? "登录中..." : "登 录" }}
            </button>
          </form>

          <div class="form-tip">
            演示账号：<strong>admin</strong> / <strong>123456</strong> / <strong>FAC-001</strong>。当前为 Vue 3 + Vite 正式工程版。
            <div class="hero-actions">
              <button class="btn btn-secondary btn-sm" type="button" @click="emit('fill-demo')">一键填充演示账号</button>
            </div>
          </div>
        </div>

        <div class="auth-meta">
          © 2026 山东汉鑫科技股份有限公司提供技术支持 · MES Vue Engineering Version
        </div>
      </div>
    </div>
  </section>
</template>
