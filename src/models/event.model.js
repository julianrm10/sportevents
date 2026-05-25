// Modelo de eventos: consultas, creación, actualización y eliminación sobre la tabla events
const db = require('../db/connection');

// Devuelve todos los eventos con el nombre del creador y el recuento de inscripciones
function findAll(conditions = [], params = []) {
  let sql = `SELECT e.*, u.nombre AS creator_nombre,
               (SELECT COUNT(*) FROM registrations r WHERE r.evento_id = e.id) AS reg_count
             FROM events e JOIN users u ON e.creator_id = u.id`;
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' ORDER BY e.fecha ASC';
  return db.query(sql, params);
}

// Devuelve un evento por ID con el nombre del creador
function findById(id) {
  return db.query(
    `SELECT e.*, u.nombre AS creator_nombre
     FROM events e JOIN users u ON e.creator_id = u.id
     WHERE e.id = ?`,
    [id]
  );
}

// Devuelve un evento por ID sin joins adicionales
function findByIdRaw(id) {
  return db.query('SELECT * FROM events WHERE id = ?', [id]);
}

// Devuelve un evento solo si está en estado abierto
function findOpenById(id) {
  return db.query("SELECT * FROM events WHERE id = ? AND estado = 'abierto'", [id]);
}

// Devuelve únicamente el nombre de la imagen de un evento
function findImageById(id) {
  return db.query('SELECT imagen FROM events WHERE id = ?', [id]);
}

// Devuelve todos los eventos con campos mínimos (para selectores)
function findAllSimple() {
  return db.query('SELECT id, titulo, tipo, estado FROM events ORDER BY fecha DESC');
}

// Devuelve todos los eventos con métricas de partidos para el panel de admin
function findAllForAdmin(conditions = [], params = []) {
  let sql = `SELECT e.*, u.nombre AS creator_nombre,
               (SELECT COUNT(DISTINCT r.team_id) FROM registrations r WHERE r.evento_id = e.id AND r.team_id IS NOT NULL) AS reg_count,
               COALESCE(SUM(m.estado = 'jugado'),    0) AS played_matches,
               COALESCE(SUM(m.estado = 'pendiente'), 0) AS pending_matches
             FROM events e
             JOIN users u ON e.creator_id = u.id
             LEFT JOIN matches m ON m.evento_id = e.id`;
  if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
  sql += ' GROUP BY e.id, u.nombre ORDER BY e.fecha DESC';
  return db.query(sql, params);
}

// Devuelve los N eventos más recientes con métricas para el dashboard
function findRecentForAdmin(limit = 5) {
  return db.query(
    `SELECT e.*, u.nombre AS creator_nombre,
             (SELECT COUNT(DISTINCT r.team_id) FROM registrations r WHERE r.evento_id = e.id AND r.team_id IS NOT NULL) AS reg_count,
             COALESCE(SUM(m.estado = 'pendiente'), 0) AS pending_matches,
             COALESCE(SUM(m.estado = 'jugado'),    0) AS played_matches
     FROM events e
     JOIN users u ON e.creator_id = u.id
     LEFT JOIN matches m ON m.evento_id = e.id
     GROUP BY e.id, u.nombre
     ORDER BY e.created_at DESC LIMIT ?`,
    [limit]
  );
}

// Devuelve el total de eventos registrados
function countAll() {
  return db.query('SELECT COUNT(*) AS totalEvents FROM events');
}

// Inserta un nuevo evento en la base de datos
function create(titulo, descripcion, tipo, fecha, lugar, max_equipos, min_equipos, imagen, creator_id) {
  return db.query(
    `INSERT INTO events (titulo, descripcion, tipo, fecha, lugar, max_equipos, min_equipos, imagen, creator_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [titulo, descripcion, tipo, fecha, lugar, max_equipos, min_equipos, imagen, creator_id]
  );
}

// Actualiza todos los campos editables de un evento
function update(id, titulo, descripcion, tipo, fecha, lugar, max_equipos, min_equipos, imagen, estado) {
  return db.query(
    `UPDATE events
     SET titulo=?, descripcion=?, tipo=?, fecha=?, lugar=?, max_equipos=?, min_equipos=?, imagen=?, estado=?
     WHERE id=?`,
    [titulo, descripcion, tipo, fecha, lugar, max_equipos, min_equipos, imagen, estado, id]
  );
}

// Cambia el estado de un evento; acepta una conexión transaccional opcional
function setEstado(id, estado, conn = db) {
  return conn.query('UPDATE events SET estado = ? WHERE id = ?', [estado, id]);
}

// Elimina un evento por ID (la cascada en BD elimina inscripciones, partidos y favoritos)
function remove(id) {
  return db.query('DELETE FROM events WHERE id = ?', [id]);
}

module.exports = {
  findAll, findById, findByIdRaw, findOpenById, findImageById,
  findAllSimple, findAllForAdmin, findRecentForAdmin,
  countAll, create, update, setEstado, remove,
};
