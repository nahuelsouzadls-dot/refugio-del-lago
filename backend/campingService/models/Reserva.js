const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Reserva = sequelize.define('Reserva', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  checkIn: { type: DataTypes.DATEONLY, allowNull: false },
  checkOut: { type: DataTypes.DATEONLY, allowNull: false },
  cantidadDePersonas: { type: DataTypes.INTEGER, allowNull: false },
  montoTotal: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  estado: {
    type: DataTypes.ENUM('pendiente', 'confirmada', 'checkin', 'checkout', 'cancelada'),
    defaultValue: 'pendiente',
  },
}, {
  tableName: 'reservas',
  timestamps: true,
});

module.exports = Reserva;
