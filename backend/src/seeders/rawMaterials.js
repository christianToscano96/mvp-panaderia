const mongoose = require('mongoose');
require('dotenv').config();

const RawMaterial = require('../models/RawMaterial');
const Category = require('../models/Category');
const Branch = require('../models/Branch');

const seedRawMaterials = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Conectado a MongoDB');

    // Obtener categorías
    const harina = await Category.findOne({ name: 'Harinas' });
    const lacteos = await Category.findOne({ name: 'Lácteos' });
    const endulzantes = await Category.findOne({ name: 'Endulzantes' });
    const levaduras = await Category.findOne({ name: 'Levaduras' });
    const grasas = await Category.findOne({ name: 'Grasas' });
    const frutasSecas = await Category.findOne({ name: 'Frutas Secas' });
    const esencias = await Category.findOne({ name: 'Esencias' });
    const sal = await Category.findOne({ name: 'Sal y Especias' });

    // Obtener sucursales
    const branches = await Branch.find({ isActive: true });
    const stockBase = branches.map(b => ({ branch: b._id, quantity: 0 }));

    // Limpiar existentes
    await RawMaterial.deleteMany({});
    console.log('🗑️ Materias primas existentes eliminadas');

    // Crear materias primas
    const mp = await RawMaterial.insertMany([
      { name: 'Harina 000', category: harina._id, unit: 'kg', costPerUnit: 800, minStock: 10, stock: stockBase },
      { name: 'Harina 0000', category: harina._id, unit: 'kg', costPerUnit: 900, minStock: 10, stock: stockBase },
      { name: 'Harina integral', category: harina._id, unit: 'kg', costPerUnit: 1100, minStock: 5, stock: stockBase },
      { name: 'Levadura fresca', category: levaduras._id, unit: 'kg', costPerUnit: 2500, minStock: 2, stock: stockBase },
      { name: 'Levadura seca', category: levaduras._id, unit: 'kg', costPerUnit: 8000, minStock: 1, stock: stockBase },
      { name: 'Azúcar', category: endulzantes._id, unit: 'kg', costPerUnit: 700, minStock: 10, stock: stockBase },
      { name: 'Azúcar impalpable', category: endulzantes._id, unit: 'kg', costPerUnit: 1200, minStock: 5, stock: stockBase },
      { name: 'Dulce de leche', category: endulzantes._id, unit: 'kg', costPerUnit: 3500, minStock: 3, stock: stockBase },
      { name: 'Manteca', category: grasas._id, unit: 'kg', costPerUnit: 4500, minStock: 5, stock: stockBase },
      { name: 'Margarina', category: grasas._id, unit: 'kg', costPerUnit: 2800, minStock: 5, stock: stockBase },
      { name: 'Aceite', category: grasas._id, unit: 'l', costPerUnit: 1800, minStock: 10, stock: stockBase },
      { name: 'Grasa vacuna', category: grasas._id, unit: 'kg', costPerUnit: 5000, minStock: 3, stock: stockBase },
      { name: 'Huevos', category: lacteos._id, unit: 'docena', costPerUnit: 1200, minStock: 5, stock: stockBase },
      { name: 'Leche entera', category: lacteos._id, unit: 'l', costPerUnit: 950, minStock: 20, stock: stockBase },
      { name: 'Crema de leche', category: lacteos._id, unit: 'l', costPerUnit: 2500, minStock: 5, stock: stockBase },
      { name: 'Sal fina', category: sal._id, unit: 'kg', costPerUnit: 450, minStock: 5, stock: stockBase },
      { name: 'Nueces', category: frutasSecas._id, unit: 'kg', costPerUnit: 8000, minStock: 2, stock: stockBase },
      { name: 'Pasas de uva', category: frutasSecas._id, unit: 'kg', costPerUnit: 4500, minStock: 2, stock: stockBase },
      { name: 'Esencia de vainilla', category: esencias._id, unit: 'l', costPerUnit: 12000, minStock: 0.5, stock: stockBase },
      { name: 'Cacao en polvo', category: esencias._id, unit: 'kg', costPerUnit: 6500, minStock: 2, stock: stockBase },
    ]);

    console.log(`✅ ${mp.length} materias primas creadas`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedRawMaterials();