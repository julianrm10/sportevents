// Modelo de usuarios: consultas y operaciones sobre la tabla users
const db = require('../db/connection');

// Busca un usuario por su email (incluye el hash de contraseña para autenticación)
function findByEmail(email) {
  return db.query('SELECT * FROM users WHERE email = ?', [email]);
}

// Busca un usuario por su ID sin devolver la contraseña
function findById(id) {
  return db.query(
    'SELECT id, nombre, email, role, created_at FROM users WHERE id = ?',
    [id]
  );
}

// Comprueba si un email ya está registrado
function emailExists(email) {
  return db.query('SELECT id FROM users WHERE email = ?', [email]);
}

// Inserta un nuevo usuario con la contraseña ya hasheada
function create(nombre, email, passwordHash) {
  return db.query(
    'INSERT INTO users (nombre, email, password) VALUES (?, ?, ?)',
    [nombre, email, passwordHash]
  );
}

module.exports = { findByEmail, findById, emailExists, create };
