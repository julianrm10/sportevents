const router = require('express').Router();
const ctrl   = require('../controllers/teamController');
const auth   = require('../middlewares/auth');

router.post('/crear',         auth, ctrl.createTeam);
router.post('/:id/eliminar',  auth, ctrl.deleteTeam);

module.exports = router;
