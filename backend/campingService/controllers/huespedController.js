const { Huesped, Reserva } = require('../models');

exports.listar = async (req, res) => {
  try {
    const huespedes = await Huesped.findAll({
      include: [{ model: Reserva, as: 'reservas' }],
      order: [['apellido', 'ASC']],
    });
    res.json(huespedes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.obtener = async (req, res) => {
  try {
    const huesped = await Huesped.findByPk(req.params.id, {
      include: [{ model: Reserva, as: 'reservas' }],
    });
    if (!huesped) return res.status(404).json({ error: 'No encontrado' });
    res.json(huesped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
