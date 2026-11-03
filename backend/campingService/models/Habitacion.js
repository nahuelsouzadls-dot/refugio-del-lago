const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Habitacion = sequelize.define('Habitacion', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  numero: { type: DataTypes.STRING, allowNull: false, unique: true },
  tipo: { type: DataTypes.ENUM('estandar', 'suite'), allowNull: false },
  titulo: { type: DataTypes.STRING, allowNull: false },
  capacidadMaxima: { type: DataTypes.INTEGER, allowNull: false },
  precioPorNoche: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  tieneBalcon: { type: DataTypes.BOOLEAN, defaultValue: false },
}, {
  tableName: 'habitaciones',
  timestamps: true,
});

module.exports = Habitacion;
