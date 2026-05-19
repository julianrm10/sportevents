const db = require('../db/connection');

async function toggleFavorite(req, res) {
  const { evento_id } = req.body;
  const user_id = req.user.id;
  try {
    const [existing] = await db.query(
      'SELECT id FROM favorites WHERE user_id = ? AND evento_id = ?', [user_id, evento_id]
    );
    if (existing.length) {
      await db.query('DELETE FROM favorites WHERE user_id = ? AND evento_id = ?', [user_id, evento_id]);
      req.flash('success', 'Evento eliminado de favoritos.');
    } else {
      await db.query('INSERT INTO favorites (user_id, evento_id) VALUES (?, ?)', [user_id, evento_id]);
      req.flash('success', 'Evento añadido a favoritos.');
    }
    res.redirect(`/eventos/${evento_id}`);
  } catch (err) {
    console.error(err);
    req.flash('error', 'Ha ocurrido un error, inténtalo de nuevo.');
    res.redirect(`/eventos/${evento_id}`);
  }
}

module.exports = { toggleFavorite };
