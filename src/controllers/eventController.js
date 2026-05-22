const fs                = require('fs');
const path              = require('path');
const EventModel        = require('../models/event.model');
const TeamModel         = require('../models/team.model');
const RegistrationModel = require('../models/registration.model');
const FavoriteModel     = require('../models/favorite.model');
const MatchModel        = require('../models/match.model');

// ── Listado de eventos ────────────────────────────────────────
async function listEvents(req, res) {
  const { tipo, estado } = req.query;
  const validTipos   = ['futbol_sala','baloncesto','tenis'];
  const validEstados = ['abierto','en_curso','finalizado'];
  try {
    const conditions = [];
    const params     = [];
    if (tipo   && validTipos.includes(tipo))     { conditions.push('e.tipo = ?');   params.push(tipo); }
    if (estado && validEstados.includes(estado)) { conditions.push('e.estado = ?'); params.push(estado); }

    const [events] = await EventModel.findAll(conditions, params);
    res.render('eventos/index', {
      events,
      tipo:   validTipos.includes(tipo)     ? tipo   : '',
      estado: validEstados.includes(estado) ? estado : '',
    });
  } catch (err) {
    console.error(err);
    res.render('error', { title: 'Error', message: 'No se pudieron cargar los eventos.' });
  }
}

// ── Detalle de evento ─────────────────────────────────────────
async function eventDetail(req, res) {
  const { id } = req.params;
  try {
    const [evRows] = await EventModel.findById(id);
    if (!evRows.length) {
      return res.status(404).render('error', { title: '404', message: 'Evento no encontrado.' });
    }
    const event = evRows[0];

    const [registeredTeams]        = await TeamModel.findByEvent(id);
    const [matches]                = await MatchModel.findByEvent(id);
    const [[{ teamCount }]]        = await RegistrationModel.countTeamsByEvent(id);

    let userRegistration = null;
    let isFavorite       = false;
    let userTeams        = [];

    if (req.user) {
      const [regs] = await RegistrationModel.findByUserAndEventWithTeam(req.user.id, id);
      userRegistration = regs[0] || null;

      const [favs] = await FavoriteModel.findByUserAndEvent(req.user.id, id);
      isFavorite = favs.length > 0;

      if (event.estado === 'abierto') {
        const [teams] = await TeamModel.findByOwnerAndTipo(req.user.id, event.tipo);
        userTeams = teams;
      }
    }

    // ── Clasificación ─────────────────────────────────────────
    const standingsMap = {};
    registeredTeams.forEach(t => {
      standingsMap[t.id] = {
        id: t.id, nombre: t.nombre,
        jugados: 0, ganados: 0, empatados: 0, perdidos: 0,
        sfavor: 0, scontra: 0, puntos: 0,
      };
    });
    const allowDraws = event.tipo !== 'tenis';
    matches.filter(m => m.estado === 'jugado').forEach(m => {
      const t1 = standingsMap[m.team1_id];
      const t2 = standingsMap[m.team2_id];
      if (!t1 || !t2) return;
      t1.jugados++; t2.jugados++;
      t1.sfavor  += m.score_team1; t1.scontra += m.score_team2;
      t2.sfavor  += m.score_team2; t2.scontra += m.score_team1;
      if (m.score_team1 > m.score_team2) {
        t1.ganados++; t1.puntos += 3; t2.perdidos++;
      } else if (m.score_team1 < m.score_team2) {
        t2.ganados++; t2.puntos += 3; t1.perdidos++;
      } else if (allowDraws) {
        t1.empatados++; t1.puntos++; t2.empatados++; t2.puntos++;
      }
    });
    const standings = Object.values(standingsMap).sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      const sdDiff = (b.sfavor - b.scontra) - (a.sfavor - a.scontra);
      if (sdDiff !== 0) return sdDiff;
      return b.sfavor - a.sfavor;
    });

    res.render('eventos/detalle', {
      event, registeredTeams, matches, standings,
      userRegistration, isFavorite, userTeams, teamCount,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { title: 'Error', message: 'No se pudo cargar el evento.' });
  }
}

// ── Formulario crear ──────────────────────────────────────────
function showCreateForm(req, res) {
  res.render('eventos/form', { event: null });
}

// ── Crear evento ──────────────────────────────────────────────
async function createEvent(req, res) {
  const { titulo, descripcion, tipo, fecha, lugar, max_equipos, min_equipos } = req.body;
  if (!titulo || !descripcion || !tipo || !fecha || !lugar || !max_equipos || !min_equipos) {
    req.flash('error', 'Por favor rellena todos los campos obligatorios.');
    return res.redirect('/eventos/crear');
  }
  if (parseInt(max_equipos, 10) < parseInt(min_equipos, 10)) {
    req.flash('error', 'El máximo de equipos debe ser mayor o igual al mínimo.');
    return res.redirect('/eventos/crear');
  }
  const imagen     = req.file ? req.file.filename : null;
  const creator_id = req.user.id;
  try {
    await EventModel.create(titulo, descripcion, tipo, fecha, lugar, max_equipos, min_equipos, imagen, creator_id);
    req.flash('success', 'Evento creado correctamente.');
    res.redirect('/eventos');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ha ocurrido un error, inténtalo de nuevo.');
    res.redirect('/eventos/crear');
  }
}

// ── Formulario editar ─────────────────────────────────────────
async function showEditForm(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await EventModel.findByIdRaw(id);
    if (!rows.length) return res.render('error', { title: '404', message: 'Evento no encontrado.' });
    res.render('eventos/form', { event: rows[0] });
  } catch (err) {
    res.render('error', { title: 'Error', message: 'No se pudo cargar el evento.' });
  }
}

// ── Actualizar evento ─────────────────────────────────────────
async function updateEvent(req, res) {
  const { id } = req.params;
  const { titulo, descripcion, tipo, fecha, lugar, max_equipos, min_equipos, estado } = req.body;
  if (!titulo || !descripcion || !tipo || !fecha || !lugar || !max_equipos || !min_equipos) {
    req.flash('error', 'Por favor rellena todos los campos obligatorios.');
    return res.redirect(`/eventos/${id}/editar`);
  }
  if (parseInt(max_equipos, 10) < parseInt(min_equipos, 10)) {
    req.flash('error', 'El máximo de equipos debe ser mayor o igual al mínimo.');
    return res.redirect(`/eventos/${id}/editar`);
  }
  try {
    const [rows] = await EventModel.findImageById(id);
    if (!rows.length) return res.render('error', { title: '404', message: 'Evento no encontrado.' });

    let imagen = rows[0].imagen;
    if (req.file) {
      if (imagen) {
        const old = path.join(__dirname, '../../public/uploads', imagen);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      imagen = req.file.filename;
    }

    await EventModel.update(id, titulo, descripcion, tipo, fecha, lugar, max_equipos, min_equipos || 2, imagen, estado);
    req.flash('success', 'Evento actualizado correctamente.');
    res.redirect(`/eventos/${id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ha ocurrido un error, inténtalo de nuevo.');
    res.redirect(`/eventos/${id}/editar`);
  }
}

// ── Eliminar evento ───────────────────────────────────────────
async function deleteEvent(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await EventModel.findImageById(id);
    if (rows.length && rows[0].imagen) {
      const img = path.join(__dirname, '../../public/uploads', rows[0].imagen);
      if (fs.existsSync(img)) fs.unlinkSync(img);
    }
    await EventModel.remove(id);
    req.flash('success', 'Evento eliminado correctamente.');
    res.redirect('/admin/eventos');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ha ocurrido un error, inténtalo de nuevo.');
    res.redirect('/admin/eventos');
  }
}

module.exports = {
  listEvents, eventDetail,
  showCreateForm, createEvent,
  showEditForm, updateEvent,
  deleteEvent,
};
