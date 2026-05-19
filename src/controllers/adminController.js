const db = require('../db/connection');

// ── Dashboard ─────────────────────────────────────────────────
async function showDashboard(req, res) {
  try {
    const [[{ totalEvents }]]         = await db.query('SELECT COUNT(*) AS totalEvents FROM events');
    const [[{ totalTeams }]]          = await db.query('SELECT COUNT(*) AS totalTeams FROM teams');
    const [[{ inscribedTeams }]]      = await db.query(
      'SELECT COUNT(DISTINCT team_id) AS inscribedTeams FROM registrations WHERE team_id IS NOT NULL'
    );
    const [[{ pendingMatches }]]      = await db.query(
      "SELECT COUNT(*) AS pendingMatches FROM matches WHERE estado = 'pendiente'"
    );

    const [recentEvents] = await db.query(
      `SELECT e.*, u.nombre AS creator_nombre,
              (SELECT COUNT(DISTINCT r.team_id) FROM registrations r WHERE r.evento_id = e.id AND r.team_id IS NOT NULL) AS reg_count,
              COALESCE(SUM(m.estado = 'pendiente'), 0) AS pending_matches,
              COALESCE(SUM(m.estado = 'jugado'),    0) AS played_matches
       FROM events e
       JOIN users u ON e.creator_id = u.id
       LEFT JOIN matches m ON m.evento_id = e.id
       GROUP BY e.id, u.nombre
       ORDER BY e.created_at DESC LIMIT 5`
    );

    res.render('admin/dashboard', {
      stats: { totalEvents, totalTeams, inscribedTeams, pendingMatches },
      recentEvents,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { title: 'Error', message: 'Error al cargar el dashboard.' });
  }
}

// ── Gestión de eventos ────────────────────────────────────────
async function manageEvents(req, res) {
  const { estado } = req.query;
  const validEstados = ['abierto', 'en_curso', 'finalizado'];
  const selectedEstado = validEstados.includes(estado) ? estado : '';
  try {
    let sql = `SELECT e.*, u.nombre AS creator_nombre,
              (SELECT COUNT(DISTINCT r.team_id) FROM registrations r WHERE r.evento_id = e.id AND r.team_id IS NOT NULL) AS reg_count,
              COALESCE(SUM(m.estado = 'jugado'),    0) AS played_matches,
              COALESCE(SUM(m.estado = 'pendiente'), 0) AS pending_matches
       FROM events e
       JOIN users u ON e.creator_id = u.id
       LEFT JOIN matches m ON m.evento_id = e.id`;
    const params = [];
    if (selectedEstado) { sql += ' WHERE e.estado = ?'; params.push(selectedEstado); }
    sql += ' GROUP BY e.id, u.nombre ORDER BY e.fecha DESC';

    const [events] = await db.query(sql, params);
    res.render('admin/events', { events, selectedEstado });
  } catch (err) {
    console.error(err);
    res.render('error', { title: 'Error', message: 'Error al cargar eventos.' });
  }
}

// ── Gestión de partidos ───────────────────────────────────────
async function manageMatches(req, res) {
  const { evento_id } = req.query;
  try {
    const [events] = await db.query('SELECT id, titulo, tipo, estado FROM events ORDER BY fecha DESC');

    let matches        = [];
    let selectedEvent  = null;
    let availableTeams = [];
    let teamCount      = 0;
    let matchCount     = 0;

    if (evento_id) {
      const [evRows] = await db.query('SELECT * FROM events WHERE id = ?', [evento_id]);
      selectedEvent  = evRows[0] || null;

      if (selectedEvent) {
        const [m] = await db.query(
          `SELECT m.*, t1.nombre AS team1_nombre, t2.nombre AS team2_nombre
           FROM matches m
           JOIN teams t1 ON m.team1_id = t1.id
           JOIN teams t2 ON m.team2_id = t2.id
           WHERE m.evento_id = ?
           ORDER BY COALESCE(m.fecha, '9999-12-31') ASC`, [evento_id]
        );
        matches    = m;
        matchCount = m.length;

        const [teams] = await db.query(
          `SELECT DISTINCT t.*
           FROM registrations r JOIN teams t ON r.team_id = t.id
           WHERE r.evento_id = ? AND r.team_id IS NOT NULL
           ORDER BY t.nombre`, [evento_id]
        );
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

// ── Generar partidos round-robin ──────────────────────────────
// POST /admin/eventos/:id/generar-partidos
async function generateMatches(req, res) {
  const evento_id = req.params.id;
  const conn = await db.getConnection();
  try {
    const [evRows] = await conn.query('SELECT * FROM events WHERE id = ?', [evento_id]);
    if (!evRows.length) {
      conn.release();
      req.flash('error', 'Evento no encontrado.');
      return res.redirect(`/admin/partidos?evento_id=${evento_id}`);
    }
    const event = evRows[0];

    const [[{ matchCount }]] = await conn.query(
      'SELECT COUNT(*) AS matchCount FROM matches WHERE evento_id = ?', [evento_id]
    );
    if (matchCount > 0) {
      conn.release();
      req.flash('error', 'Los partidos ya fueron generados para este evento.');
      return res.redirect(`/admin/partidos?evento_id=${evento_id}`);
    }

    const [teams] = await conn.query(
      `SELECT DISTINCT t.*
       FROM registrations r JOIN teams t ON r.team_id = t.id
       WHERE r.evento_id = ? AND r.team_id IS NOT NULL
       ORDER BY t.nombre`, [evento_id]
    );

    if (teams.length < event.min_equipos) {
      conn.release();
      req.flash('error', 'No hay suficientes equipos inscritos para generar los partidos.');
      return res.redirect(`/admin/partidos?evento_id=${evento_id}`);
    }

    await conn.beginTransaction();
    for (let i = 0; i < teams.length; i++) {
      for (let j = i + 1; j < teams.length; j++) {
        await conn.query(
          'INSERT INTO matches (evento_id, team1_id, team2_id) VALUES (?, ?, ?)',
          [evento_id, teams[i].id, teams[j].id]
        );
      }
    }
    await conn.query("UPDATE events SET estado = 'en_curso' WHERE id = ?", [evento_id]);
    await conn.commit();
    conn.release();

    const totalMatches = (teams.length * (teams.length - 1)) / 2;
    req.flash('success', `Partidos generados correctamente. ${totalMatches} partidos round-robin creados.`);
    res.redirect(`/admin/partidos?evento_id=${evento_id}`);
  } catch (err) {
    await conn.rollback().catch(() => {});
    conn.release();
    console.error(err);
    req.flash('error', 'Ha ocurrido un error, inténtalo de nuevo.');
    res.redirect(`/admin/partidos?evento_id=${evento_id}`);
  }
}

// ── Actualizar partido ────────────────────────────────────────
async function updateMatch(req, res) {
  const { id } = req.params;
  const { goles_team1, goles_team2, estado, fecha, evento_id } = req.body;
  try {
    await db.query(
      'UPDATE matches SET goles_team1=?, goles_team2=?, estado=?, fecha=? WHERE id=?',
      [goles_team1 || 0, goles_team2 || 0, estado, fecha || null, id]
    );
    req.flash('success', 'Resultado guardado correctamente.');
    res.redirect(`/admin/partidos?evento_id=${evento_id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ha ocurrido un error, inténtalo de nuevo.');
    res.redirect(`/admin/partidos?evento_id=${evento_id}`);
  }
}


// ── Finalizar torneo ──────────────────────────────────────────
async function finalizeEvent(req, res) {
  const { id } = req.params;
  try {
    const [evRows] = await db.query('SELECT * FROM events WHERE id = ?', [id]);
    if (!evRows.length) {
      req.flash('error', 'Evento no encontrado.');
      return res.redirect('/admin/partidos');
    }
    if (evRows[0].estado !== 'en_curso') {
      req.flash('error', 'Solo se pueden finalizar eventos en curso.');
      return res.redirect(`/admin/partidos?evento_id=${id}`);
    }
    const [[{ pendingCount }]] = await db.query(
      "SELECT COUNT(*) AS pendingCount FROM matches WHERE evento_id = ? AND estado = 'pendiente'", [id]
    );
    if (pendingCount > 0) {
      req.flash('error', `Quedan ${pendingCount} partido(s) pendiente(s) por jugar.`);
      return res.redirect(`/admin/partidos?evento_id=${id}`);
    }
    await db.query("UPDATE events SET estado = 'finalizado' WHERE id = ?", [id]);
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
