// Controlador de administración: dashboard, gestión de eventos y partidos
const EventModel        = require('../models/event.model');
const TeamModel         = require('../models/team.model');
const RegistrationModel = require('../models/registration.model');
const MatchModel        = require('../models/match.model');

// Muestra el panel de administración con estadísticas globales y eventos recientes
async function showDashboard(req, res) {
  try {
    const [[{ totalEvents }]]    = await EventModel.countAll();
    const [[{ totalTeams }]]     = await TeamModel.countAll();
    const [[{ inscribedTeams }]] = await RegistrationModel.countInscribed();
    const [[{ pendingMatches }]] = await MatchModel.countPending();
    const [recentEvents]         = await EventModel.findRecentForAdmin(5);

    res.render('admin/dashboard', {
      stats: { totalEvents, totalTeams, inscribedTeams, pendingMatches },
      recentEvents,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { title: 'Error', message: 'Error al cargar el dashboard.' });
  }
}

// Lista todos los eventos, con filtro opcional por estado
async function manageEvents(req, res) {
  const { estado } = req.query;
  const validEstados = ['abierto', 'en_curso', 'finalizado'];
  const selectedEstado = validEstados.includes(estado) ? estado : '';
  try {
    const conditions = [];
    const params     = [];
    if (selectedEstado) { conditions.push('e.estado = ?'); params.push(selectedEstado); }

    const [events] = await EventModel.findAllForAdmin(conditions, params);
    res.render('admin/events', { events, selectedEstado });
  } catch (err) {
    console.error(err);
    res.render('error', { title: 'Error', message: 'Error al cargar eventos.' });
  }
}

// Muestra la gestión de partidos de un evento seleccionado
async function manageMatches(req, res) {
  const { evento_id } = req.query;
  try {
    const [events] = await EventModel.findAllSimple();

    let matches        = [];
    let selectedEvent  = null;
    let availableTeams = [];
    let teamCount      = 0;
    let matchCount     = 0;

    if (evento_id) {
      const [evRows] = await EventModel.findByIdRaw(evento_id);
      selectedEvent  = evRows[0] || null;

      if (selectedEvent) {
        const [m]      = await MatchModel.findByEventAdmin(evento_id);
        matches        = m;
        matchCount     = m.length;

        const [teams]  = await TeamModel.findRegisteredByEvent(evento_id);
        availableTeams = teams;
        teamCount      = teams.length;
      }
    }

    res.render('admin/matches', {
      events,
      matches,
      selectedEvent,
      availableTeams,
      teamCount,
      matchCount,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { title: 'Error', message: 'Error al cargar partidos.' });
  }
}

// Genera todos los partidos en formato round-robin y pasa el evento a "en curso"
async function generateMatches(req, res) {
  const evento_id = req.params.id;
  try {
    const [evRows] = await EventModel.findByIdRaw(evento_id);
    if (!evRows.length) {
      req.flash('error', 'Evento no encontrado.');
      return res.redirect(`/admin/partidos?evento_id=${evento_id}`);
    }
    const event = evRows[0];

    const [[{ matchCount }]] = await MatchModel.countByEvent(evento_id);
    if (matchCount > 0) {
      req.flash('error', 'Los partidos ya fueron generados para este evento.');
      return res.redirect(`/admin/partidos?evento_id=${evento_id}`);
    }

    const [teams] = await TeamModel.findRegisteredByEvent(evento_id);
    if (teams.length < event.min_equipos) {
      req.flash('error', 'No hay suficientes equipos inscritos para generar los partidos.');
      return res.redirect(`/admin/partidos?evento_id=${evento_id}`);
    }

    const totalMatches = await MatchModel.generateRoundRobin(evento_id, teams);
    req.flash('success', `Partidos generados correctamente. ${totalMatches} partidos round-robin creados.`);
    res.redirect(`/admin/partidos?evento_id=${evento_id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ha ocurrido un error, inténtalo de nuevo.');
    res.redirect(`/admin/partidos?evento_id=${evento_id}`);
  }
}

// Actualiza el resultado y estado de un partido
async function updateMatch(req, res) {
  const { id } = req.params;
  const { score_team1, score_team2, estado, fecha, evento_id } = req.body;
  try {
    const fechaMysql = fecha ? (fecha.replace('T', ' ') + ':00').substring(0, 19) : null;
    await MatchModel.update(id, score_team1 || 0, score_team2 || 0, estado, fechaMysql);
    req.flash('success', 'Partido actualizado correctamente.');
    res.redirect(`/admin/partidos?evento_id=${evento_id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ha ocurrido un error, inténtalo de nuevo.');
    res.redirect(`/admin/partidos?evento_id=${evento_id}`);
  }
}

// Finaliza el torneo si todos los partidos han sido jugados
async function finalizeEvent(req, res) {
  const { id } = req.params;
  try {
    const [evRows] = await EventModel.findByIdRaw(id);
    if (!evRows.length) {
      req.flash('error', 'Evento no encontrado.');
      return res.redirect('/admin/partidos');
    }
    if (evRows[0].estado !== 'en_curso') {
      req.flash('error', 'Solo se pueden finalizar eventos en curso.');
      return res.redirect(`/admin/partidos?evento_id=${id}`);
    }
    const [[{ pendingCount }]] = await MatchModel.countPendingByEvent(id);
    if (pendingCount > 0) {
      req.flash('error', `Quedan ${pendingCount} partido(s) pendiente(s) por jugar.`);
      return res.redirect(`/admin/partidos?evento_id=${id}`);
    }
    await EventModel.setEstado(id, 'finalizado');
    req.flash('success', 'Torneo finalizado correctamente.');
    res.redirect(`/admin/partidos?evento_id=${id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ha ocurrido un error, inténtalo de nuevo.');
    res.redirect(`/admin/partidos?evento_id=${id}`);
  }
}

module.exports = {
  showDashboard, manageEvents,
  manageMatches, generateMatches, updateMatch,
  finalizeEvent,
};
