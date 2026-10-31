/**
 * Authentication and Role Authorization Middleware
 */

function requireAuth(req, res, next) {
  if (!req.session || !req.session.user) {
    if (req.accepts('json')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Please log in to continue.',
        code: 'AUTH_REQUIRED'
      });
    }
    return res.redirect('/login.html');
  }
  next();
}

function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      if (req.accepts('json')) {
        return res.status(401).json({
          success: false,
          error: 'Unauthorized: Please log in to continue.',
          code: 'AUTH_REQUIRED'
        });
      }
      return res.redirect('/login.html');
    }

    if (!roles.includes(req.session.user.role)) {
      if (req.accepts('json')) {
        return res.status(403).json({
          success: false,
          error: `Forbidden: Access restricted to ${roles.join(' or ')} accounts.`,
          code: 'INSUFFICIENT_PERMISSIONS'
        });
      }
      return res.status(403).send('Forbidden: Insufficient permissions.');
    }

    next();
  };
}

module.exports = {
  requireAuth,
  requireRole,
  requireAdmin: requireRole(['Admin']),
  requireStudent: requireRole(['Student'])
};
