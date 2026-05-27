// Middleware de autenticación: verifica que exista una sesión de usuario activa
function authMiddleware(req, res, next) {
  if (!req.session.user) return res.redirect('/auth/login');
  req.user        = req.session.user;
  res.locals.user = req.session.user;
  next();
}

module.exports = authMiddleware;
