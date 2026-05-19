const jwt = require('jsonwebtoken');

// Requiere usuario autenticado
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
