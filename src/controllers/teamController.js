// Controlador de equipos: creación y eliminación de equipos de usuario
const TeamModel         = require('../models/team.model');
const RegistrationModel = require('../models/registration.model');

// Crea un nuevo equipo asociado al usuario autenticado
async function createTeam(req, res) {
  const { nombre, tipo } = req.body;
  const creator_id = req.user.id;
  if (!nombre || !tipo) {
    req.flash('error', 'Rellena todos los campos requeridos.');
    return res.redirect('/perfil');
  }
  try {
    await TeamModel.create(nombre.trim(), tipo, creator_id);
    req.flash('success', 'Equipo creado correctamente.');
    res.redirect('/perfil#tab-equipos');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ha ocurrido un error, inténtalo de nuevo.');
    res.redirect('/perfil#tab-equipos');
  }
}

// Elimina un equipo si pertenece al usuario y no está en un torneo en curso
async function deleteTeam(req, res) {
  const { id }     = req.params;
  const creator_id = req.user.id;
  try {
    const [[team]] = await TeamModel.findByIdAndOwner(id, creator_id);
    if (!team) {
      req.flash('error', 'Equipo no encontrado.');
      return res.redirect('/perfil#tab-equipos');
    }

    const [[{ enCurso }]] = await RegistrationModel.countActiveByTeam(id);
    if (enCurso > 0) {
      req.flash('error', 'No puedes eliminar este equipo mientras está participando en un torneo en curso.');
      return res.redirect('/perfil#tab-equipos');
    }

    await RegistrationModel.removeByTeam(id);
    await TeamModel.remove(id, creator_id);
    req.flash('success', 'Equipo eliminado correctamente.');
    res.redirect('/perfil#tab-equipos');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ha ocurrido un error, inténtalo de nuevo.');
    res.redirect('/perfil#tab-equipos');
  }
}

module.exports = { createTeam, deleteTeam };
