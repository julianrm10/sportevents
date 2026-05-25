// Rutas de administración: dashboard, gestión de eventos y partidos (requiere rol admin)
const router = require('express').Router();
const ctrl   = require('../controllers/adminController');
const auth   = require('../middlewares/auth');
const admin  = require('../middlewares/admin');

router.use(auth, admin);

router.get('/',         ctrl.showDashboard);
router.get('/eventos',  ctrl.manageEvents);
router.get('/partidos', ctrl.manageMatches);

router.post('/eventos/:id/generar-partidos', ctrl.generateMatches);
router.post('/eventos/:id/finalizar',        ctrl.finalizeEvent);
router.post('/partidos/:id/actualizar',      ctrl.updateMatch);

module.exports = router;
