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
    await db.query(
      'DELETE FROM teams WHERE id = ? AND creator_id = ?', [id, creator_id]
    );
    req.flash('success', 'Equipo eliminado correctamente.');
    res.redirect('/perfil#tab-equipos');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ha ocurrido un error, inténtalo de nuevo.');
    res.redirect('/perfil#tab-equipos');
  }
}

module.exports = { createTeam, deleteTeam };
