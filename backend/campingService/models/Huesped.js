const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const Huesped = sequelize.define('Huesped', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  apellido: { type: DataTypes.STRING, allowNull: false },
  documento: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: false },
  telefono: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'huespedes',
  timestamps: true,
});

module.exports = Huesped;
