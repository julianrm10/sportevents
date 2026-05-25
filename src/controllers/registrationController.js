// Controlador de inscripciones: alta y baja de equipos en eventos
const EventModel        = require('../models/event.model');
const TeamModel         = require('../models/team.model');
const RegistrationModel = require('../models/registration.model');

// Inscribe el equipo seleccionado en el evento si cumple todas las condiciones
async function registerTeam(req, res) {
  const { evento_id, team_id } = req.body;
  const user_id = req.user.id;
  try {
    const [evRows] = await EventModel.findOpenById(evento_id);
    if (!evRows.length) {
      req.flash('error', 'Este evento no está abierto para inscripciones.');
      return res.redirect(`/eventos/${evento_id}`);
    }

    const [teamRows] = await TeamModel.findByIdAndOwnerFull(team_id, user_id);
    if (!teamRows.length) {
      req.flash('error', 'Equipo no encontrado o no te pertenece.');
      return res.redirect(`/eventos/${evento_id}`);
    }

    if (teamRows[0].tipo !== evRows[0].tipo) {
      req.flash('error', 'El tipo de deporte del equipo no coincide con el del evento.');
      return res.redirect(`/eventos/${evento_id}`);
    }

    const [regs] = await RegistrationModel.findByUserAndEvent(user_id, evento_id);
    if (regs.length) {
      req.flash('error', 'Ya estás inscrito en este evento.');
      return res.redirect(`/eventos/${evento_id}`);
    }

    const [[{ teamCount }]] = await RegistrationModel.countTeamsByEvent(evento_id);
    if (teamCount >= evRows[0].max_equipos) {
      req.flash('error', 'Este torneo ya está completo.');
      return res.redirect(`/eventos/${evento_id}`);
    }

    await RegistrationModel.create(user_id, evento_id, team_id);
    req.flash('success', 'Equipo inscrito correctamente.');
    res.redirect(`/eventos/${evento_id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ha ocurrido un error, inténtalo de nuevo.');
    res.redirect(`/eventos/${evento_id}`);
  }
}

// Cancela la inscripción del usuario en un evento abierto
async function cancelRegistration(req, res) {
  const { evento_id, redirect_to } = req.body;
  const user_id = req.user.id;
  const redirectTarget = (redirect_to && redirect_to.startsWith('/')) ? redirect_to : `/eventos/${evento_id}`;
  try {
    const [evRows] = await EventModel.findOpenById(evento_id);
    if (!evRows.length) {
      req.flash('error', 'No se puede cancelar la inscripción de un evento que no está abierto.');
      return res.redirect(`/eventos/${evento_id}`);
    }
    await RegistrationModel.removeByUserAndEvent(user_id, evento_id);
    req.flash('success', 'Inscripción cancelada correctamente.');
    res.redirect(redirectTarget);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ha ocurrido un error, inténtalo de nuevo.');
    res.redirect(`/eventos/${evento_id}`);
  }
}

module.exports = { registerTeam, cancelRegistration };
