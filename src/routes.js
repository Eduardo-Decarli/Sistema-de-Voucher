// Importar módulos necessários
const express = require('express');
const router = express.Router();
const voucherController = require('./voucherController');

// Rota padrão para a raiz
router.get('/', (req, res) => {
    res.send('Bem-vindo à API de Vouchers da Pousada!');
});

// Definir rotas da API
router.post('/reservas', voucherController.createReservation);
router.get('/reservas', voucherController.getReservations);
router.get('/reservas/:id', voucherController.getReservationById);
router.delete('/reservas/:id', voucherController.deleteReservation);
router.get('/reservas/:id/pdf', voucherController.downloadVoucherPDF);
router.get('/export/svg', voucherController.exportToSVG);
router.get('/export/excel', voucherController.exportToExcel);

module.exports = router;