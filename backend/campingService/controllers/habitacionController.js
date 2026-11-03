const { Habitacion, Reserva } = require('../models');
const { Op } = require('sequelize');

exports.listar = async (req, res) => {
  try {
    const habitaciones = await Habitacion.findAll({ order: [['numero', 'ASC']] });
    res.json(habitaciones);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const habitacion = await Habitacion.findByPk(req.params.id);
    if (!habitacion) return res.status(404).json({ error: 'No encontrada' });
    res.json(habitacion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const habitacion = await Habitacion.create(req.body);
    res.status(201).json(habitacion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const habitacion = await Habitacion.findByPk(req.params.id);
    if (!habitacion) return res.status(404).json({ error: 'No encontrada' });
    await habitacion.update(req.body);
    res.json(habitacion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.eliminar = async (req, res) => {
  try {
    const habitacion = await Habitacion.findByPk(req.params.id);
    if (!habitacion) return res.status(404).json({ error: 'No encontrada' });
    await habitacion.destroy();
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.disponibles = async (req, res) => {
  try {
    const { checkIn, checkOut } = req.query;
    if (!checkIn || !checkOut) {
      return res.status(400).json({ error: 'Faltan checkIn y checkOut' });
    }
    const ocupadas = await Reserva.findAll({
      attributes: ['idHabitacion'],
      where: {
        estado: { [Op.ne]: 'cancelada' },
        [Op.and]: [
          { checkIn: { [Op.lt]: checkOut } },
          { checkOut: { [Op.gt]: checkIn } },
        ],
      },
    });
    const idsOcupadas = ocupadas.map(r => r.idHabitacion);
    const libres = await Habitacion.findAll({
      where: { id: { [Op.notIn]: idsOcupadas } },
      order: [['precioPorNoche', 'ASC']],
    });
    res.json(libres);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
