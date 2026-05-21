const bcrypt    = require('bcrypt');
const jwt       = require('jsonwebtoken');
const UserModel = require('../models/user.model');

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  maxAge:   7 * 24 * 60 * 60 * 1000,
};

function showLogin(req, res) {
  if (req.user) return res.redirect('/eventos');
  res.render('auth/login');
}

function showRegister(req, res) {
  if (req.user) return res.redirect('/eventos');
  res.render('auth/register');
}

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
    const token = jwt.sign(
      { id: user.id, nombre: user.nombre, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.cookie('token', token, COOKIE_OPTS);
    req.flash('success', `¡Bienvenido de nuevo, ${user.nombre}!`);
    res.redirect(user.role === 'admin' ? '/admin' : '/eventos');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error del servidor. Inténtalo de nuevo.');
    res.redirect('/auth/login');
  }
}

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

function logout(req, res) {
  res.clearCookie('token');
  res.redirect('/auth/login');
}

module.exports = { showLogin, showRegister, login, register, logout };
