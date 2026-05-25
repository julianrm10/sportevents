// Middleware de autenticación: verifica que exista un token JWT válido en la cookie
const jwt = require('jsonwebtoken');

function authMiddleware(req, res, next) {
  const token = req.cookies.token;
  if (!token) return res.redirect('/auth/login');
  try {
    req.user        = jwt.verify(token, process.env.JWT_SECRET);
    res.locals.user = req.user;
    next();
  } catch {
    res.clearCookie('token');
    res.redirect('/auth/login');
  }
}

module.exports = authMiddleware;
