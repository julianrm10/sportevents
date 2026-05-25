// Modelo de favoritos: consultas, creación y eliminación sobre la tabla favorites
const db = require('../db/connection');

// Busca el favorito de un usuario para un evento concreto
function findByUserAndEvent(user_id, evento_id) {
  return db.query(
    'SELECT id FROM favorites WHERE user_id = ? AND evento_id = ?',
    [user_id, evento_id]
  );
}

// Devuelve todos los eventos marcados como favoritos por un usuario
function findByUser(user_id) {
  return db.query(
    `SELECT f.*, e.titulo, e.tipo, e.fecha, e.estado, e.lugar, e.imagen
     FROM favorites f
     JOIN events e ON f.evento_id = e.id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`,
    [user_id]
  );
}

// Añade un evento a los favoritos de un usuario
function create(user_id, evento_id) {
  return db.query(
    'INSERT INTO favorites (user_id, evento_id) VALUES (?, ?)',
    [user_id, evento_id]
  );
}

// Elimina un evento de los favoritos de un usuario
function remove(user_id, evento_id) {
  return db.query(
    'DELETE FROM favorites WHERE user_id = ? AND evento_id = ?',
    [user_id, evento_id]
  );
}

module.exports = { findByUserAndEvent, findByUser, create, remove };
