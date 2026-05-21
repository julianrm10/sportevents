const db = require('../db/connection');

function findByUserAndEvent(user_id, evento_id) {
  return db.query(
    'SELECT id FROM favorites WHERE user_id = ? AND evento_id = ?',
    [user_id, evento_id]
  );
}

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

function create(user_id, evento_id) {
  return db.query(
    'INSERT INTO favorites (user_id, evento_id) VALUES (?, ?)',
    [user_id, evento_id]
  );
}

function remove(user_id, evento_id) {
  return db.query(
    'DELETE FROM favorites WHERE user_id = ? AND evento_id = ?',
    [user_id, evento_id]
  );
}

module.exports = { findByUserAndEvent, findByUser, create, remove };
