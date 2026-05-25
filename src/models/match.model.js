const db = require('../db/connection');

function findByEvent(evento_id) {
  return db.query(
    `SELECT m.*, t1.nombre AS team1_nombre, t2.nombre AS team2_nombre
     FROM matches m
     JOIN teams t1 ON m.team1_id = t1.id
     JOIN teams t2 ON m.team2_id = t2.id
     WHERE m.evento_id = ?
     ORDER BY COALESCE(m.fecha, '9999-12-31') ASC`,
    [evento_id]
  );
}

function findByEventAdmin(evento_id) {
  return db.query(
    `SELECT m.*, t1.nombre AS team1_nombre, t2.nombre AS team2_nombre
     FROM matches m
     JOIN teams t1 ON m.team1_id = t1.id
     JOIN teams t2 ON m.team2_id = t2.id
     WHERE m.evento_id = ?
     ORDER BY COALESCE(m.fecha, '9999-12-31') ASC`,
    [evento_id]
  );
}

function countByEvent(evento_id) {
  return db.query(
    'SELECT COUNT(*) AS matchCount FROM matches WHERE evento_id = ?',
    [evento_id]
  );
}

function countPending() {
  return db.query("SELECT COUNT(*) AS pendingMatches FROM matches WHERE estado = 'pendiente'");
}

function countPendingByEvent(evento_id) {
  return db.query(
    "SELECT COUNT(*) AS pendingCount FROM matches WHERE evento_id = ? AND estado = 'pendiente'",
    [evento_id]
  );
}

function create(evento_id, team1_id, team2_id, conn = db) {
  return conn.query(
    'INSERT INTO matches (evento_id, team1_id, team2_id) VALUES (?, ?, ?)',
    [evento_id, team1_id, team2_id]
  );
}

function update(id, score_team1, score_team2, estado, fecha) {
  return db.query(
    'UPDATE matches SET score_team1=?, score_team2=?, estado=?, fecha=? WHERE id=?',
    [score_team1, score_team2, estado, fecha, id]
  );
}

module.exports = {
  findByEvent, findByEventAdmin, countByEvent, countPending,
  countPendingByEvent, create, update,
};
