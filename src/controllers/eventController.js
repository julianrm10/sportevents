const db   = require('../db/connection');
const fs   = require('fs');
const path = require('path');

// ── Listado de eventos ────────────────────────────────────────
async function listEvents(req, res) {
  const { tipo, estado } = req.query;
  const validTipos   = ['futbol','baloncesto','tenis','otros'];
  const validEstados = ['abierto','en_curso','finalizado'];
  try {
    const conditions = [];
    const params     = [];
    if (tipo   && validTipos.includes(tipo))     { conditions.push('e.tipo = ?');   params.push(tipo); }
    if (estado && validEstados.includes(estado)) { conditions.push('e.estado = ?'); params.push(estado); }

    let sql = `SELECT e.*, u.nombre AS creator_nombre,
                 (SELECT COUNT(*) FROM registrations r WHERE r.evento_id = e.id) AS reg_count
               FROM events e JOIN users u ON e.creator_id = u.id`;
    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY e.fecha ASC';

    const [events] = await db.query(sql, params);
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
    const [evRows] = await db.query(
      `SELECT e.*, u.nombre AS creator_nombre
       FROM events e JOIN users u ON e.creator_id = u.id
       WHERE e.id = ?`, [id]
    );
    if (!evRows.length) {
      return res.status(404).render('error', { title: '404', message: 'Evento no encontrado.' });
    }
    const event = evRows[0];

    const [registeredTeams] = await db.query(
      `SELECT DISTINCT t.*, u.nombre AS creator_nombre
       FROM registrations r
       JOIN teams t ON r.team_id  = t.id
       JOIN users u ON t.creator_id = u.id
       WHERE r.evento_id = ? AND r.team_id IS NOT NULL`, [id]
    );

    const [matches] = await db.query(
      `SELECT m.*, t1.nombre AS team1_nombre, t2.nombre AS team2_nombre
       FROM matches m
       JOIN teams t1 ON m.team1_id = t1.id
       JOIN teams t2 ON m.team2_id = t2.id
       WHERE m.evento_id = ?
       ORDER BY m.fecha ASC`, [id]
    );

    const [[{ teamCount }]] = await db.query(
      'SELECT COUNT(DISTINCT team_id) AS teamCount FROM registrations WHERE evento_id = ?', [id]
    );

    let userRegistration = null;
    let isFavorite       = false;
    let userTeams        = [];

    if (req.user) {
      const [regs] = await db.query(
        `SELECT r.*, t.nombre AS team_nombre
         FROM registrations r
         JOIN teams t ON r.team_id = t.id
         WHERE r.user_id = ? AND r.evento_id = ?`,
        [req.user.id, id]
      );
      userRegistration = regs[0] || null;

      const [favs] = await db.query(
        'SELECT id FROM favorites WHERE user_id = ? AND evento_id = ?',
        [req.user.id, id]
      );
      isFavorite = favs.length > 0;

      if (event.estado === 'abierto') {
        const [teams] = await db.query(
          'SELECT * FROM teams WHERE creator_id = ? AND tipo = ? ORDER BY nombre',
          [req.user.id, event.tipo]
        );
        userTeams = teams;
      }
    }

    // ── Clasificación ─────────────────────────────────────────
    const standingsMap = {};
    registeredTeams.forEach(t => {
      standingsMap[t.id] = {
        id: t.id, nombre: t.nombre,
        jugados: 0, ganados: 0, empatados: 0, perdidos: 0,
        gfavor: 0, gcontra: 0, puntos: 0,
      };
    });
    matches.filter(m => m.estado === 'jugado').forEach(m => {
      const t1 = standingsMap[m.team1_id];
      const t2 = standingsMap[m.team2_id];
      if (!t1 || !t2) return;
      t1.jugados++; t2.jugados++;
      t1.gfavor  += m.goles_team1; t1.gcontra += m.goles_team2;
      t2.gfavor  += m.goles_team2; t2.gcontra += m.goles_team1;
      if (m.goles_team1 > m.goles_team2) {
        t1.ganados++; t1.puntos += 3; t2.perdidos++;
      } else if (m.goles_team1 < m.goles_team2) {
        t2.ganados++; t2.puntos += 3; t1.perdidos++;
      } else {
        t1.empatados++; t1.puntos++; t2.empatados++; t2.puntos++;
      }
    });
    const standings = Object.values(standingsMap).sort((a, b) => {
      if (b.puntos !== a.puntos) return b.puntos - a.puntos;
      const gdDiff = (b.gfavor - b.gcontra) - (a.gfavor - a.gcontra);
      if (gdDiff !== 0) return gdDiff;
      return b.gfavor - a.gfavor;
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
    await db.query(
      `INSERT INTO events (titulo, descripcion, tipo, fecha, lugar, max_equipos, min_equipos, imagen, creator_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [titulo, descripcion, tipo, fecha, lugar, max_equipos, min_equipos, imagen, creator_id]
    );
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
    const [rows] = await db.query('SELECT * FROM events WHERE id = ?', [id]);
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
    const [rows] = await db.query('SELECT imagen FROM events WHERE id = ?', [id]);
    if (!rows.length) return res.render('error', { title: '404', message: 'Evento no encontrado.' });

    let imagen = rows[0].imagen;
    if (req.file) {
      if (imagen) {
        const old = path.join(__dirname, '../../public/uploads', imagen);
        if (fs.existsSync(old)) fs.unlinkSync(old);
      }
      imagen = req.file.filename;
    }

    await db.query(
      `UPDATE events
       SET titulo=?, descripcion=?, tipo=?, fecha=?, lugar=?, max_equipos=?, min_equipos=?, imagen=?, estado=?
       WHERE id=?`,
      [titulo, descripcion, tipo, fecha, lugar, max_equipos, min_equipos || 2, imagen, estado, id]
    );
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
    const [rows] = await db.query('SELECT imagen FROM events WHERE id = ?', [id]);
    if (rows.length && rows[0].imagen) {
      const img = path.join(__dirname, '../../public/uploads', rows[0].imagen);
      if (fs.existsSync(img)) fs.unlinkSync(img);
    }
    await db.query('DELETE FROM events WHERE id = ?', [id]);
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
