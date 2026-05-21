const db = require('../db/connection');

function findByUserAndEvent(user_id, evento_id) {
  return db.query(
    'SELECT id FROM registrations WHERE user_id = ? AND evento_id = ?',
    [user_id, evento_id]
  );
}

function findByUserAndEventWithTeam(user_id, evento_id) {
  return db.query(
    `SELECT r.*, t.nombre AS team_nombre
     FROM registrations r
     JOIN teams t ON r.team_id = t.id
     WHERE r.user_id = ? AND r.evento_id = ?`,
    [user_id, evento_id]
  );
}

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

function countTeamsByEvent(evento_id) {
  return db.query(
    'SELECT COUNT(DISTINCT team_id) AS teamCount FROM registrations WHERE evento_id = ?',
    [evento_id]
  );
}

function countInscribed() {
  return db.query(
    'SELECT COUNT(DISTINCT team_id) AS inscribedTeams FROM registrations WHERE team_id IS NOT NULL'
  );
}

function countActiveByTeam(team_id) {
  return db.query(
    `SELECT COUNT(*) AS enCurso
     FROM registrations r
     JOIN events e ON r.evento_id = e.id
     WHERE r.team_id = ? AND e.estado = 'en_curso'`,
    [team_id]
  );
}

function create(user_id, evento_id, team_id) {
  return db.query(
    'INSERT INTO registrations (user_id, evento_id, team_id) VALUES (?, ?, ?)',
    [user_id, evento_id, team_id]
  );
}

function updateTeam(team_id, user_id, evento_id) {
  return db.query(
    'UPDATE registrations SET team_id = ? WHERE user_id = ? AND evento_id = ?',
    [team_id, user_id, evento_id]
  );
}

function removeByTeam(team_id) {
  return db.query('DELETE FROM registrations WHERE team_id = ?', [team_id]);
}

module.exports = {
  findByUserAndEvent, findByUserAndEventWithTeam, findByUser,
  countTeamsByEvent, countInscribed, countActiveByTeam,
  create, updateTeam, removeByTeam,
};
