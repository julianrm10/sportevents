const db = require('../db/connection');

function findByEmail(email) {
  return db.query('SELECT * FROM users WHERE email = ?', [email]);
}

function findById(id) {
  return db.query(
    'SELECT id, nombre, email, role, created_at FROM users WHERE id = ?',
    [id]
  );
}

function emailExists(email) {
  return db.query('SELECT id FROM users WHERE email = ?', [email]);
}

function create(nombre, email, passwordHash) {
  return db.query(
    'INSERT INTO users (nombre, email, password) VALUES (?, ?, ?)',
    [nombre, email, passwordHash]
  );
}

module.exports = { findByEmail, findById, emailExists, create };
