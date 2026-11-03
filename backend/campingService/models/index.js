const sequelize = require('../database');
const Habitacion = require('./Habitacion');
const Huesped = require('./Huesped');
const Reserva = require('./Reserva');
const Usuario = require('./Usuario');

Huesped.hasMany(Reserva, { foreignKey: 'idHuesped', as: 'reservas' });
Reserva.belongsTo(Huesped, { foreignKey: 'idHuesped', as: 'huesped' });

Habitacion.hasMany(Reserva, { foreignKey: 'idHabitacion', as: 'reservas' });
Reserva.belongsTo(Habitacion, { foreignKey: 'idHabitacion', as: 'habitacion' });

Usuario.hasMany(Reserva, { foreignKey: 'idUsuario', as: 'reservas' });
Reserva.belongsTo(Usuario, { foreignKey: 'idUsuario', as: 'usuario' });

async function seed() {
  const count = await Habitacion.count();
  if (count > 0) return;

  await Habitacion.bulkCreate([
    { numero: '101', tipo: 'suite', titulo: 'Suite Panorámica del Lago', capacidadMaxima: 4, precioPorNoche: 320, tieneBalcon: true },
    { numero: '102', tipo: 'estandar', titulo: 'Habitación Bosque', capacidadMaxima: 2, precioPorNoche: 195, tieneBalcon: false },
    { numero: '103', tipo: 'suite', titulo: 'Suite Jardín & Agua', capacidadMaxima: 3, precioPorNoche: 240, tieneBalcon: true },
    { numero: '104', tipo: 'suite', titulo: 'Cabaña Privada', capacidadMaxima: 5, precioPorNoche: 410, tieneBalcon: true },
    { numero: '105', tipo: 'estandar', titulo: 'Refugio del Pinar', capacidadMaxima: 2, precioPorNoche: 170, tieneBalcon: false },
  ]);

  await Usuario.create({
    nombreDeUsuario: 'admin',
    email: 'admin@refugio.uy',
    contrasena: 'admin123',
    rol: 'admin',
  });

  console.log('Seed inicial cargado.');
}

async function init() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    await seed();
    console.log('Base de datos sincronizada.');
  } catch (err) {
    console.error('Error al conectar la base de datos:', err.message);
    setTimeout(init, 3000);
  }
}

module.exports = { sequelize, Habitacion, Huesped, Reserva, Usuario, init };
