// Modelo de partidos: consultas, creación y actualización sobre la tabla matches
const db = require('../db/connection');

// Devuelve los partidos de un evento con nombres de equipos, ordenados por fecha
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

// Devuelve los partidos de un evento para el panel de admin (pendientes al final)
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

// Cuenta el total de partidos de un evento
function countByEvent(evento_id) {
  return db.query(
    'SELECT COUNT(*) AS matchCount FROM matches WHERE evento_id = ?',
    [evento_id]
  );
}

// Cuenta los partidos pendientes en toda la plataforma
function countPending() {
  return db.query("SELECT COUNT(*) AS pendingMatches FROM matches WHERE estado = 'pendiente'");
}

// Cuenta los partidos pendientes de un evento concreto
function countPendingByEvent(evento_id) {
  return db.query(
    "SELECT COUNT(*) AS pendingCount FROM matches WHERE evento_id = ? AND estado = 'pendiente'",
    [evento_id]
  );
}

// Inserta un nuevo partido; acepta una conexión transaccional opcional
function create(evento_id, team1_id, team2_id, conn = db) {
  return conn.query(
    'INSERT INTO matches (evento_id, team1_id, team2_id) VALUES (?, ?, ?)',
    [evento_id, team1_id, team2_id]
  );
}

// Actualiza el resultado, estado y fecha de un partido
function update(id, score_team1, score_team2, estado, fecha) {
  return db.query(
    'UPDATE matches SET score_team1=?, score_team2=?, estado=?, fecha=? WHERE id=?',
    [score_team1, score_team2, estado, fecha, id]
  );
}

// Genera los partidos round-robin para un evento dentro de una transacción y cambia el estado del evento a "en_curso"
async function generateRoundRobin(evento_id, teams) {
  const EventModel = require('./event.model');
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        await conn.query(
          'INSERT INTO matches (evento_id, team1_id, team2_id) VALUES (?, ?, ?)',
          [evento_id, teams[i].id, teams[j].id]
        );
      }
    }
    await EventModel.setEstado(evento_id, 'en_curso', conn);
    await conn.commit();
    conn.release();
    return (teams.length * (teams.length - 1)) / 2;
  } catch (err) {
    await conn.rollback().catch(() => {});
    conn.release();
    throw err;
  }
}

module.exports = {
  findByEvent, findByEventAdmin,
  countByEvent, countPending, countPendingByEvent,
  create, update, generateRoundRobin,
};
