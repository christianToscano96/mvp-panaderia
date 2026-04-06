const mongoose = require('mongoose');
require('dotenv').config();

const Category = require('../models/Category');

const seedCategories = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('📦 Conectado a MongoDB');

    // Limpiar existentes
    await Category.deleteMany({});
    console.log('🗑️ Categorías existentes eliminadas');

    // Categorías de Materia Prima
    const mpCategories = await Category.insertMany([
      { name: 'Harinas', description: 'Harinas de trigo y otros cereales', appliesTo: 'materia_prima' },
      { name: 'Lácteos', description: 'Leche, crema, huevos y derivados', appliesTo: 'materia_prima' },
      { name: 'Endulzantes', description: 'Azúcar, miel, dulce de leche', appliesTo: 'materia_prima' },
      { name: 'Levaduras', description: 'Levadura fresca y seca', appliesTo: 'materia_prima' },
      { name: 'Grasas', description: 'Manteca, margarine, aceite', appliesTo: 'materia_prima' },
      { name: 'Frutas Secas', description: 'Nueces, pasas, almendras', appliesTo: 'materia_prima' },
      { name: 'Esencias', description: 'Vainilla, ron, cacao', appliesTo: 'materia_prima' },
      { name: 'Sal y Especias', description: 'Sal fina, especias varias', appliesTo: 'materia_prima' },
    ]);
    console.log('✅ 8 categorías de Materia Prima creadas');

    // Categorías de Productos
    const prodCategories = await Category.insertMany([
      { name: 'Panes', description: 'Pan francés, pan lactal, pan integral', appliesTo: 'producto' },
      { name: 'Facturas', description: 'Medialunas, vigilantes, Cañoncitos', appliesTo: 'producto' },
      { name: 'Tortas', description: 'Tortas dulces y saladas', appliesTo: 'producto' },
      { name: 'Galletas', description: 'Galletas dulces y saladas', appliesTo: 'producto' },
      { name: 'Empanadas', description: 'Empanadas saladas', appliesTo: 'producto' },
      { name: 'Pizzas', description: 'Pizzas y prepizzas', appliesTo: 'producto' },
      { name: 'Sandwiches', description: 'Sandwiches de miga y tostados', appliesTo: 'producto' },
      { name: 'Masas Dulces', description: 'Budines, rogel, tartas', appliesTo: 'producto' },
    ]);
    console.log('✅ 8 categorías de Productos creadas');

    // Categorías para Ambos
    const bothCategories = await Category.insertMany([
      { name: 'Confitería', description: 'Productos de confitería en general', appliesTo: 'ambos' },
    ]);
    console.log('✅ 1 categoría mixta creada');

    console.log('\n📋 Resumen:');
    console.log(`  - ${mpCategories.length + prodCategories.length + bothCategories.length} categorías totales`);
    console.log(`  - ${mpCategories.length} Materia Prima`);
    console.log(`  - ${prodCategories.length} Productos`);
    console.log(`  - ${bothCategories.length} Mixtas`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

seedCategories();