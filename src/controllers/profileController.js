const db = require('../db/connection');

async function showProfile(req, res) {
  const user_id = req.user.id;
  try {
    const [[userData]] = await db.query(
      'SELECT id, nombre, email, role, created_at FROM users WHERE id = ?', [user_id]
    );

    const [registrations] = await db.query(
      `SELECT r.*, e.titulo, e.tipo, e.fecha, e.estado, e.lugar, e.imagen,
              t.nombre AS team_nombre
       FROM registrations r
       JOIN  events e ON r.evento_id = e.id
       LEFT JOIN teams t ON r.team_id = t.id
       WHERE r.user_id = ?
       ORDER BY e.fecha DESC`, [user_id]
    );

    const [favorites] = await db.query(
      `SELECT f.*, e.titulo, e.tipo, e.fecha, e.estado, e.lugar, e.imagen
       FROM favorites f
       JOIN events e ON f.evento_id = e.id
       WHERE f.user_id = ?
       ORDER BY f.created_at DESC`, [user_id]
    );

    const [teams] = await db.query(
      `SELECT t.*,
              EXISTS(
                SELECT 1 FROM registrations r
                JOIN events e ON r.evento_id = e.id
                WHERE r.team_id = t.id AND e.estado = 'en_curso'
              ) AS en_curso_activo
       FROM teams t
       WHERE t.creator_id = ?
       ORDER BY t.created_at DESC`,
      [user_id]
    );

    res.render('perfil/index', {
      profileUser: userData,
      registrations,
      favorites,
      teams,
    });
  } catch (err) {
    console.error(err);
    res.render('error', { title: 'Error', message: 'No se pudo cargar el perfil.' });
  }
}

module.exports = { showProfile };
