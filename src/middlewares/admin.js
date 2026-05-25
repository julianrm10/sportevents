// Middleware de autorización: verifica que el usuario autenticado tenga rol de administrador
function adminMiddleware(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).render('error', {
      title:   'Acceso denegado',
      message: 'No tienes permisos para acceder a esta sección.',
    });
  }
  next();
}

module.exports = adminMiddleware;
