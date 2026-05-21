const EventModel        = require('../models/event.model');
const TeamModel         = require('../models/team.model');
const RegistrationModel = require('../models/registration.model');

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
      await RegistrationModel.updateTeam(team_id, user_id, evento_id);
    } else {
      const [[{ teamCount }]] = await RegistrationModel.countTeamsByEvent(evento_id);
      if (teamCount >= evRows[0].max_equipos) {
        req.flash('error', 'Este torneo ya está completo.');
        return res.redirect(`/eventos/${evento_id}`);
      }
      await RegistrationModel.create(user_id, evento_id, team_id);
    }
    req.flash('success', 'Equipo inscrito correctamente.');
    res.redirect(`/eventos/${evento_id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ha ocurrido un error, inténtalo de nuevo.');
    res.redirect(`/eventos/${evento_id}`);
  }
}

module.exports = { registerTeam };
