const { Reserva, Habitacion, Huesped } = require('../models');
const { Op } = require('sequelize');

function calcularNoches(checkIn, checkOut) {
  const ms = new Date(checkOut) - new Date(checkIn);
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

exports.listar = async (req, res) => {
  try {
    const reservas = await Reserva.findAll({
      include: [
        { model: Huesped, as: 'huesped' },
        { model: Habitacion, as: 'habitacion' },
      ],
      order: [['checkIn', 'ASC']],
    });
    res.json(reservas);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.crear = async (req, res) => {
  try {
    const {
      nombre, apellido, email, telefono, documento,
      idHabitacion, checkIn, checkOut, cantidadDePersonas,
    } = req.body;

    if (!nombre || !email || !idHabitacion || !checkIn || !checkOut) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
    }

    const habitacion = await Habitacion.findByPk(idHabitacion);
    if (!habitacion) return res.status(404).json({ error: 'Habitación no existe' });

    const conflicto = await Reserva.findOne({
      where: {
        idHabitacion,
        estado: { [Op.ne]: 'cancelada' },
        [Op.and]: [
          { checkIn: { [Op.lt]: checkOut } },
          { checkOut: { [Op.gt]: checkIn } },
        ],
      },
    });
    if (conflicto) {
      return res.status(409).json({ error: 'Habitación ocupada en esas fechas' });
    }

    const [huesped] = await Huesped.findOrCreate({
      where: { email },
      defaults: { nombre, apellido: apellido || '', telefono, documento },
    });

    const noches = calcularNoches(checkIn, checkOut);
    const montoTotal = Number(habitacion.precioPorNoche) * noches;

    const reserva = await Reserva.create({
      idHuesped: huesped.id,
      idHabitacion,
      checkIn,
      checkOut,
      cantidadDePersonas: cantidadDePersonas || 1,
      montoTotal,
      estado: 'confirmada',
    });

    const completa = await Reserva.findByPk(reserva.id, {
      include: [
        { model: Huesped, as: 'huesped' },
        { model: Habitacion, as: 'habitacion' },
      ],
    });
    res.status(201).json(completa);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.actualizar = async (req, res) => {
  try {
    const reserva = await Reserva.findByPk(req.params.id);
    if (!reserva) return res.status(404).json({ error: 'No encontrada' });
    await reserva.update(req.body);
    res.json(reserva);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.cancelar = async (req, res) => {
  try {
    const reserva = await Reserva.findByPk(req.params.id);
    if (!reserva) return res.status(404).json({ error: 'No encontrada' });
    await reserva.update({ estado: 'cancelada' });
    res.json(reserva);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
