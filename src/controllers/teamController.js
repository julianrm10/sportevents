const db = require('../db/connection');

async function createTeam(req, res) {
  const { nombre, tipo } = req.body;
  const creator_id = req.user.id;
  if (!nombre || !tipo) {
    req.flash('error', 'Rellena todos los campos requeridos.');
    return res.redirect('/perfil');
  }
  try {
    await db.query(
      'INSERT INTO teams (nombre, tipo, creator_id) VALUES (?, ?, ?)',
      [nombre.trim(), tipo, creator_id]
    );
    req.flash('success', 'Equipo creado correctamente.');
    res.redirect('/perfil#tab-equipos');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ha ocurrido un error, inténtalo de nuevo.');
    res.redirect('/perfil#tab-equipos');
  }
}

async function deleteTeam(req, res) {
  const { id }     = req.params;
  const creator_id = req.user.id;
  try {
    const [[team]] = await db.query(
      'SELECT id FROM teams WHERE id = ? AND creator_id = ?', [id, creator_id]
    );
    if (!team) {
      req.flash('error', 'Equipo no encontrado.');
      return res.redirect('/perfil#tab-equipos');
    }

    const [[{ enCurso }]] = await db.query(
      `SELECT COUNT(*) AS enCurso
       FROM registrations r
       JOIN events e ON r.evento_id = e.id
       WHERE r.team_id = ? AND e.estado = 'en_curso'`,
      [id]
    );
    if (enCurso > 0) {
      req.flash('error', 'No puedes eliminar este equipo mientras está participando en un torneo en curso.');
      return res.redirect('/perfil#tab-equipos');
    }

    await db.query('DELETE FROM teams WHERE id = ? AND creator_id = ?', [id, creator_id]);
    req.flash('success', 'Equipo eliminado correctamente.');
    res.redirect('/perfil#tab-equipos');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ha ocurrido un error, inténtalo de nuevo.');
    res.redirect('/perfil#tab-equipos');
  }
}

module.exports = { createTeam, deleteTeam };
