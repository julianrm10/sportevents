// Punto de entrada de la aplicación: configura Express, middlewares y rutas
require('dotenv').config();
const express      = require('express');
const cookieParser = require('cookie-parser');
const session      = require('express-session');
const flash        = require('connect-flash');
const path         = require('path');
const jwt          = require('jsonwebtoken');

const app = express();

// Motor de plantillas EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middlewares de parseo y archivos estáticos
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Sesión necesaria para los mensajes flash
app.use(session({
  secret:            process.env.JWT_SECRET,
  resave:            false,
  saveUninitialized: false,
  cookie:            { maxAge: 60 * 60 * 1000 },
}));
app.use(flash());

// Inyecta req.user y res.locals.user en cada petición a partir del JWT de la cookie
app.use((req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    try {
      const decoded   = jwt.verify(token, process.env.JWT_SECRET);
      req.user        = decoded;
      res.locals.user = decoded;
    } catch {
      req.user        = null;
      res.locals.user = null;
    }
  } else {
    req.user        = null;
    res.locals.user = null;
  }
  next();
});

// Expone los mensajes flash a todas las vistas
app.use((req, res, next) => {
  res.locals.flash = {
    success: req.flash('success'),
    error:   req.flash('error'),
  };
  next();
});

// Rutas
app.use('/auth',     require('./src/routes/auth'));
app.use('/eventos',  require('./src/routes/events'));
app.use('/equipos',  require('./src/routes/teams'));
app.use('/admin',    require('./src/routes/admin'));
app.use('/perfil',   require('./src/routes/profile'));
app.use('/noticias', require('./src/routes/news.routes'));

app.get('/',         (req, res) => res.redirect('/eventos'));
app.get('/nosotros', (req, res) => res.render('nosotros', { title: 'Nosotros' }));
app.get('/faq',      (req, res) => res.render('faq',      { title: 'Preguntas frecuentes' }));

// Manejador 404
app.use((req, res) => {
  res.status(404).render('error', { title: 'Página no encontrada', message: 'La página que buscas no existe.' });
});

// Manejador de errores internos
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { title: 'Error del servidor', message: 'Algo salió mal. Inténtalo de nuevo.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`SportEvents → http://localhost:${PORT}`));
