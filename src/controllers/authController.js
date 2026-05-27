// Controlador de autenticación: registro, login y logout de usuarios
const bcrypt    = require('bcrypt');
const UserModel = require('../models/user.model');

// Muestra el formulario de login
function showLogin(req, res) {
  if (req.user) return res.redirect('/eventos');
  res.render('auth/login');
}

// Muestra el formulario de registro
function showRegister(req, res) {
  if (req.user) return res.redirect('/eventos');
  res.render('auth/register');
}

// Autentica al usuario e inicia la sesión
async function login(req, res) {
  const { email, password } = req.body;
  try {
    const [rows] = await UserModel.findByEmail(email);
    if (!rows.length) {
      req.flash('error', 'Email o contraseña incorrectos.');
      return res.redirect('/auth/login');
    }
    const user  = rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      req.flash('error', 'Email o contraseña incorrectos.');
      return res.redirect('/auth/login');
    }
    req.session.user = { id: user.id, nombre: user.nombre, email: user.email, role: user.role };
    req.flash('success', `¡Bienvenido de nuevo, ${user.nombre}!`);
    res.redirect(user.role === 'admin' ? '/admin' : '/eventos');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error del servidor. Inténtalo de nuevo.');
    res.redirect('/auth/login');
  }
}

// Valida los datos y crea un nuevo usuario
async function register(req, res) {
  const { nombre, email, password, password2 } = req.body;
  if (!nombre || nombre.trim().length < 3) {
    req.flash('error', 'El nombre debe tener al menos 3 caracteres.');
    return res.redirect('/auth/register');
  }
  if (!email || !email.includes('@')) {
    req.flash('error', 'Introduce un email válido.');
    return res.redirect('/auth/register');
  }
  if (password !== password2) {
    req.flash('error', 'Las contraseñas no coinciden.');
    return res.redirect('/auth/register');
  }
  if (password.length < 6) {
    req.flash('error', 'La contraseña debe tener al menos 6 caracteres.');
    return res.redirect('/auth/register');
  }
  try {
    const [existing] = await UserModel.emailExists(email);
    if (existing.length) {
      req.flash('error', 'Este email ya está registrado.');
      return res.redirect('/auth/register');
    }
    const hash = await bcrypt.hash(password, 10);
    await UserModel.create(nombre, email, hash);
    req.flash('success', '¡Bienvenido a SportEvents! Ya puedes iniciar sesión.');
    res.redirect('/auth/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error del servidor. Inténtalo de nuevo.');
    res.redirect('/auth/register');
  }
}

// Destruye la sesión y redirige al login
function logout(req, res) {
  req.session.destroy(() => res.redirect('/auth/login'));
}

module.exports = { showLogin, showRegister, login, register, logout };
