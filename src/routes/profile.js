// Rutas del perfil de usuario (requiere autenticación)
const router = require('express').Router();
const ctrl   = require('../controllers/profileController');
const auth   = require('../middlewares/auth');

router.use(auth);
router.get('/', ctrl.showProfile);

module.exports = router;
