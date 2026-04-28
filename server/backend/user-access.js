function getRole(roles, roleCode) {
  return (roles || []).find((item) => item.code === roleCode) || null;
}

function getPermissionsByRole(roles, roleCode) {
  const role = getRole(roles, roleCode);
  return role ? [...role.permissionCodes] : [];
}

function getPermissionsForUser(roles, user) {
  if (Array.isArray(user?.permissionCodes) && user.permissionCodes.length) {
    return [...user.permissionCodes];
  }

  if (Array.isArray(user?.permissions) && user.permissions.length) {
    return [...user.permissions];
  }

  return getPermissionsByRole(roles, user?.roleCode);
}

function buildUserView(user, { roles = [], moduleRegistry = [] } = {}) {
  const role = getRole(roles, user.roleCode);
  const permissions = getPermissionsForUser(roles, user);
  const availableModules = moduleRegistry
    .filter((item) => !item.permission || permissions.includes(item.permission))
    .map((item) => item.key);

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role || (role ? role.name : user.roleCode),
    roleCode: user.roleCode,
    dept: user.dept,
    factory: user.factory,
    factoryCode: user.factoryCode,
    permissions,
    modules: availableModules
  };
}

module.exports = {
  buildUserView,
  getPermissionsByRole,
  getPermissionsForUser,
  getRole
};
