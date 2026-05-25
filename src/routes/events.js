// Rutas de eventos: listado, detalle, CRUD (admin) e inscripciones/favoritos (usuario)
const router     = require('express').Router();
const eventCtrl  = require('../controllers/eventController');
const regCtrl    = require('../controllers/registrationController');
const favCtrl    = require('../controllers/favoriteController');
const auth       = require('../middlewares/auth');
const admin      = require('../middlewares/admin');
const upload     = require('../middlewares/upload');

// Rutas estáticas antes de /:id para evitar conflictos con el parámetro dinámico
router.get('/', eventCtrl.listEvents);

router.get('/crear',  auth, admin, eventCtrl.showCreateForm);
router.post('/crear', auth, admin, upload.single('imagen'), eventCtrl.createEvent);

router.post('/inscribir-equipo',     auth, regCtrl.registerTeam);
router.post('/cancelar-inscripcion', auth, regCtrl.cancelRegistration);
router.post('/favorito',             auth, favCtrl.toggleFavorite);

router.get('/:id',          eventCtrl.eventDetail);
router.get('/:id/editar',   auth, admin, eventCtrl.showEditForm);
router.post('/:id/editar',  auth, admin, upload.single('imagen'), eventCtrl.updateEvent);
router.post('/:id/eliminar', auth, admin, eventCtrl.deleteEvent);

module.exports = router;
