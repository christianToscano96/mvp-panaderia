const mongoose = require('mongoose');
require('dotenv').config();

const Branch = require('../models/Branch');
const User = require('../models/User');

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Conectado a MongoDB');

    // Limpiar colecciones existentes
    await User.deleteMany({});
    await Branch.deleteMany({});
    console.log('🗑️ Colecciones limpiadas');

    // Crear sucursales
    const branches = await Branch.insertMany([
      {
        name: 'Casa Central',
        address: 'Av. principal 123',
        phone: '11-1234-5678',
        isActive: true
      },
      {
        name: 'Sucursal Norte',
        address: 'Av. Norte 456',
        phone: '11-9876-5432',
        isActive: true
      }
    ]);
    console.log('✅ 2 sucursales creadas');

    // Obtener ObjectIds de las sucursales
    const centralId = branches[0]._id;
    const norteId = branches[1]._id;

    // Crear usuarios seed
    const users = await User.insertMany([
      {
        name: 'Juan Admin',
        email: 'admin@panaderia.com',
        password: 'admin123',
        role: 'admin',
        branch: centralId,
        isActive: true
      },
      {
        name: 'Maria Manager',
        email: 'manager@panaderia.com',
        password: 'manager123',
        role: 'manager',
        branch: centralId,
        isActive: true
      },
      {
        name: 'Pedro Cajero',
        email: 'cajero@panaderia.com',
        password: 'cajero123',
        role: 'cajero',
        branch: centralId,
        isActive: true
      },
      {
        name: 'Lucas Panadero',
        email: 'panadero@panaderia.com',
        password: 'panadero123',
        role: 'panadero',
        branch: centralId,
        isActive: true
      }
    ]);
    console.log('✅ 4 usuarios creados');

    console.log('\n📋 Credenciales seed:');
    console.log('  Admin: admin@panaderia.com / admin123');
    console.log('  Manager: manager@panaderia.com / manager123');
    console.log('  Cajero: cajero@panaderia.com / cajero123');
    console.log('  Panadero: panadero@panaderia.com / panadero123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error en seed:', error);
    process.exit(1);
  }
};

seedData();