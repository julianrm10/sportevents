const db = require('../db/connection');

function create(nombre, tipo, creator_id) {
  return db.query(
    'INSERT INTO teams (nombre, tipo, creator_id) VALUES (?, ?, ?)',
    [nombre, tipo, creator_id]
  );
}

function findByOwner(creator_id) {
  return db.query(
    `SELECT t.*,
            EXISTS(
              SELECT 1 FROM registrations r
              JOIN events e ON r.evento_id = e.id
              WHERE r.team_id = t.id AND e.estado = 'en_curso'
            ) AS en_curso_activo
     FROM teams t
     WHERE t.creator_id = ?
     ORDER BY t.created_at DESC`,
    [creator_id]
  );
}

function findByIdAndOwner(id, creator_id) {
  return db.query(
    'SELECT id FROM teams WHERE id = ? AND creator_id = ?',
    [id, creator_id]
  );
}

function findByIdAndOwnerFull(id, creator_id) {
  return db.query(
    'SELECT * FROM teams WHERE id = ? AND creator_id = ?',
    [id, creator_id]
  );
}

function findByOwnerAndTipo(creator_id, tipo) {
  return db.query(
    'SELECT * FROM teams WHERE creator_id = ? AND tipo = ? ORDER BY nombre',
    [creator_id, tipo]
  );
}

function findByEvent(evento_id) {
  return db.query(
    `SELECT DISTINCT t.*, u.nombre AS creator_nombre
     FROM registrations r
     JOIN teams t ON r.team_id  = t.id
     JOIN users u ON t.creator_id = u.id
     WHERE r.evento_id = ? AND r.team_id IS NOT NULL`,
    [evento_id]
  );
}

function findRegisteredByEvent(evento_id) {
  return db.query(
    `SELECT DISTINCT t.*
     FROM registrations r JOIN teams t ON r.team_id = t.id
     WHERE r.evento_id = ? AND r.team_id IS NOT NULL
     ORDER BY t.nombre`,
    [evento_id]
  );
}

function remove(id, creator_id) {
  return db.query(
    'DELETE FROM teams WHERE id = ? AND creator_id = ?',
    [id, creator_id]
  );
}

function countAll() {
  return db.query('SELECT COUNT(*) AS totalTeams FROM teams');
}

module.exports = {
  create, findByOwner, findByIdAndOwner, findByIdAndOwnerFull,
  findByOwnerAndTipo, findByEvent, findRegisteredByEvent,
  remove, countAll,
};
