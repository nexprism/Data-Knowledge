// Roles permitted to access admin-only endpoints.
// SECURITY: `student` must never be here.
const ADMIN_ROLES = ['admin', 'super_admin', 'instructor'];

// Roles permitted to manage other admin accounts.
// SECURITY: only super admins may create/modify/deactivate admins.
const SUPER_ADMIN_ROLES = ['super_admin'];

// Exported so controllers can make inline admin checks (e.g. allowing an
// explicit ?userid override only for admins in checkoutController).
export const hasAdminRole = (user) => {
  if (!user) return false;
  const roles = Array.isArray(user.roles) ? user.roles : [user.role || user.roles];
  return roles.some((r) => ADMIN_ROLES.includes(r));
};

export const hasSuperAdminRole = (user) => {
  if (!user) return false;
  const roles = Array.isArray(user.roles) ? user.roles : [user.role || user.roles];
  return roles.some((r) => SUPER_ADMIN_ROLES.includes(r));
};

// True when the account was provisioned with a temporary password and the user
// has not yet set their own. Used to gate admin features until they do.
export const hasPendingPasswordChange = (user) => user?.mustChangePassword === true;

export const isAdmin = (req, res, next) => {
  if (!hasAdminRole(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin or Instructor role required',
      data: {},
      err: {
        message: 'Unauthorized access',
        userRole: req.user?.role || 'not authenticated',
      },
    });
  }

  if (hasPendingPasswordChange(req.user)) {
    return res.status(403).json({
      success: false,
      message: 'You must change your password before continuing.',
      data: {},
      code: 'PASSWORD_CHANGE_REQUIRED',
      err: { message: 'Password change required' },
    });
  }

  return next();
};

export const isSuperAdmin = (req, res, next) => {
  if (hasSuperAdminRole(req.user)) {
    if (hasPendingPasswordChange(req.user)) {
      return res.status(403).json({
        success: false,
        message: 'You must change your password before continuing.',
        data: {},
        code: 'PASSWORD_CHANGE_REQUIRED',
        err: { message: 'Password change required' },
      });
    }
    return next();
  }

  return res.status(403).json({
    success: false,
    message: 'Access denied: Super Admin role required',
    data: {},
    err: {
      message: 'Unauthorized access',
      userRole: req.user?.role || 'not authenticated',
    },
  });
};
