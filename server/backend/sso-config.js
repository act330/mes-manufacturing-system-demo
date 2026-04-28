const {
  SSO_AUTH_URL,
  SSO_CALLBACK_URL,
  SSO_CLIENT_ID,
  SSO_ENABLED,
  SSO_PROVIDER_KEY,
  SSO_PROVIDER_LABEL,
  SSO_SCOPE
} = require("./runtime-config");

function getSsoProviders() {
  return [
    {
      key: SSO_PROVIDER_KEY,
      label: SSO_PROVIDER_LABEL,
      enabled: SSO_ENABLED && Boolean(SSO_AUTH_URL) && Boolean(SSO_CLIENT_ID) && Boolean(SSO_CALLBACK_URL),
      authUrl: SSO_AUTH_URL,
      callbackUrl: SSO_CALLBACK_URL
    }
  ];
}

function buildSsoStartPayload({ provider, redirect }) {
  const targetProvider = String(provider || SSO_PROVIDER_KEY).trim() || SSO_PROVIDER_KEY;
  const configured = getSsoProviders().find((item) => item.key === targetProvider);

  if (!configured) {
    return {
      statusCode: 404,
      body: {
        error: "未找到对应的 SSO 提供方。",
        code: "sso_provider_not_found"
      }
    };
  }

  if (!configured.enabled) {
    return {
      statusCode: 501,
      body: {
        error: "SSO 接口已预留，但当前环境尚未配置。",
        code: "sso_not_configured"
      }
    };
  }

  const authUrl = new URL(configured.authUrl);
  authUrl.searchParams.set("client_id", SSO_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", SSO_CALLBACK_URL);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", SSO_SCOPE);
  authUrl.searchParams.set("state", JSON.stringify({
    provider: targetProvider,
    redirect: String(redirect || "/").trim() || "/"
  }));

  return {
    statusCode: 200,
    body: {
      provider: targetProvider,
      redirectUrl: authUrl.toString()
    }
  };
}

module.exports = {
  buildSsoStartPayload,
  getSsoProviders
};
