const express = require('express');
const billController = require('../controllers/billController');
const sessionMiddleware = require('../middleware/sessionMiddleware');

const router = express.Router();

router.use(sessionMiddleware.checkForSessionUser);

router.get('/', billController.getBillsByUser);
router.get('/:id', billController.getBillById);
router.post('/', billController.createBill);
router.delete('/:id', billController.deleteBill);

module.exports = router;
