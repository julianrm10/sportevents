// Modelo de inscripciones: consultas, creación y eliminación sobre la tabla registrations
const db = require('../db/connection');

// Busca la inscripción de un usuario en un evento concreto
function findByUserAndEvent(user_id, evento_id) {
  return db.query(
    'SELECT id FROM registrations WHERE user_id = ? AND evento_id = ?',
    [user_id, evento_id]
  );
}

// Busca la inscripción de un usuario en un evento incluyendo el nombre del equipo
function findByUserAndEventWithTeam(user_id, evento_id) {
  return db.query(
    `SELECT r.*, t.nombre AS team_nombre
     FROM registrations r
     JOIN teams t ON r.team_id = t.id
     WHERE r.user_id = ? AND r.evento_id = ?`,
    [user_id, evento_id]
  );
}

// Devuelve todas las inscripciones de un usuario con datos del evento y el equipo
function findByUser(user_id) {
  return db.query(
    `SELECT r.*, e.titulo, e.tipo, e.fecha, e.estado, e.lugar, e.imagen,
            t.nombre AS team_nombre
     FROM registrations r
     JOIN events e ON r.evento_id = e.id
     JOIN teams  t ON r.team_id  = t.id
     WHERE r.user_id = ?
     ORDER BY e.fecha DESC`,
    [user_id]
  );
}

// Cuenta los equipos distintos inscritos en un evento
function countTeamsByEvent(evento_id) {
  return db.query(
    'SELECT COUNT(DISTINCT team_id) AS teamCount FROM registrations WHERE evento_id = ?',
    [evento_id]
  );
}

// Cuenta el total de equipos distintos inscritos en toda la plataforma
function countInscribed() {
  return db.query(
    'SELECT COUNT(DISTINCT team_id) AS inscribedTeams FROM registrations WHERE team_id IS NOT NULL'
  );
}

// Cuenta las inscripciones activas de un equipo en eventos en curso
function countActiveByTeam(team_id) {
  return db.query(
    `SELECT COUNT(*) AS enCurso
     FROM registrations r
     JOIN events e ON r.evento_id = e.id
     WHERE r.team_id = ? AND e.estado = 'en_curso'`,
    [team_id]
  );
}

// Inserta una nueva inscripción de un equipo en un evento
function create(user_id, evento_id, team_id) {
  return db.query(
    'INSERT INTO registrations (user_id, evento_id, team_id) VALUES (?, ?, ?)',
    [user_id, evento_id, team_id]
  );
}

// Elimina todas las inscripciones de un equipo (usado al borrar el equipo)
function removeByTeam(team_id) {
  return db.query('DELETE FROM registrations WHERE team_id = ?', [team_id]);
}

// Elimina la inscripción de un usuario en un evento concreto
function removeByUserAndEvent(user_id, evento_id) {
  return db.query(
    'DELETE FROM registrations WHERE user_id = ? AND evento_id = ?',
    [user_id, evento_id]
  );
}

module.exports = {
  findByUserAndEvent, findByUserAndEventWithTeam, findByUser,
  countTeamsByEvent, countInscribed, countActiveByTeam,
  create, removeByTeam, removeByUserAndEvent,
};
