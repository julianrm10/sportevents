const router = require('express').Router();
const eventCtrl  = require('../controllers/eventController');
const regCtrl    = require('../controllers/registrationController');
const favCtrl    = require('../controllers/favoriteController');
const auth       = require('../middlewares/auth');
const admin      = require('../middlewares/admin');
const upload     = require('../middlewares/upload');

// ── Rutas estáticas ANTES de /:id ─────────────────────────────
router.get('/', eventCtrl.listEvents);

// Admin: crear evento
router.get('/crear', auth, admin, eventCtrl.showCreateForm);
router.post('/crear', auth, admin, upload.single('imagen'), eventCtrl.createEvent);

// Acciones autenticadas (POST, sin parámetro dinámico)
router.post('/inscribir-equipo', auth, regCtrl.registerTeam);
router.post('/favorito',         auth, favCtrl.toggleFavorite);

// ── Rutas con :id ─────────────────────────────────────────────
router.get('/:id', eventCtrl.eventDetail);

// Admin: editar / eliminar
router.get( '/:id/editar',   auth, admin, eventCtrl.showEditForm);
router.post('/:id/editar',   auth, admin, upload.single('imagen'), eventCtrl.updateEvent);
router.post('/:id/eliminar', auth, admin, eventCtrl.deleteEvent);

module.exports = router;
