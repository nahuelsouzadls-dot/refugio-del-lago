const express = require('express');
const habitacionCtrl = require('../controllers/habitacionController');
const reservaCtrl = require('../controllers/reservaController');
const huespedCtrl = require('../controllers/huespedController');

module.exports = (app) => {
  const api = express.Router();

  api.get('/habitaciones', habitacionCtrl.listar);
  api.get('/habitaciones/disponibles', habitacionCtrl.disponibles);
  api.get('/habitaciones/:id', habitacionCtrl.obtener);
  api.post('/habitaciones', habitacionCtrl.crear);
  api.put('/habitaciones/:id', habitacionCtrl.actualizar);
  api.delete('/habitaciones/:id', habitacionCtrl.eliminar);

  api.get('/reservas', reservaCtrl.listar);
  api.post('/reservas', reservaCtrl.crear);
  api.put('/reservas/:id', reservaCtrl.actualizar);
  api.post('/reservas/:id/cancelar', reservaCtrl.cancelar);

  api.get('/huespedes', huespedCtrl.listar);
  api.get('/huespedes/:id', huespedCtrl.obtener);

  app.use('/api', api);
};
