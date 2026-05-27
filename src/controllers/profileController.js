// Controlador de perfil: muestra los datos, inscripciones, favoritos y equipos del usuario
const UserModel         = require('../models/user.model');
const RegistrationModel = require('../models/registration.model');
const FavoriteModel     = require('../models/favorite.model');
const TeamModel         = require('../models/team.model');

// Carga y renderiza el perfil completo del usuario autenticado
async function showProfile(req, res) {
  const user_id = req.user.id;
  try {
    const [[userData]] = await UserModel.findById(user_id);
    if (!userData) {
      return res.redirect('/auth/login');
    }
    const [registrations] = await RegistrationModel.findByUser(user_id);
    const [favorites]     = await FavoriteModel.findByUser(user_id);
    const [teams]         = await TeamModel.findByOwner(user_id);

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
