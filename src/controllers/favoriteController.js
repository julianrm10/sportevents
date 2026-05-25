// Controlador de favoritos: añadir y quitar eventos de la lista de favoritos
const FavoriteModel = require('../models/favorite.model');

// Alterna el estado de favorito de un evento para el usuario autenticado
async function toggleFavorite(req, res) {
  const { evento_id } = req.body;
  const user_id = req.user.id;
  try {
    const [existing] = await FavoriteModel.findByUserAndEvent(user_id, evento_id);
    if (existing.length) {
      await FavoriteModel.remove(user_id, evento_id);
      req.flash('success', 'Evento eliminado de favoritos.');
    } else {
      await FavoriteModel.create(user_id, evento_id);
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
