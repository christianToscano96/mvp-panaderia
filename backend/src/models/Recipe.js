const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
    unique: true,
  },
  yield: {
    type: Number,
    required: true,
    min: 1,
  },
  yieldUnit: {
    type: String,
    enum: ['unidad', 'kg', 'docena'],
    default: 'unidad',
  },
  ingredients: [{
    rawMaterial: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RawMaterial',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unit: {
      type: String,
      required: true,
    },
  }],
  instructions: {
    type: String,
  },
  prepTime: {
    type: Number, // minutos
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Virtual: calcular costo de producción automáticamente
recipeSchema.virtual('calculatedCost').get(async function() {
  let totalCost = 0;
  for (const ing of this.ingredients) {
    const RawMaterial = mongoose.model('RawMaterial');
    const mat = await RawMaterial.findById(ing.rawMaterial).lean();
    if (mat) {
      // Convertir unidades si es necesario (simplificado por ahora)
      totalCost += mat.costPerUnit * ing.quantity;
    }
  }
  // Costo por unidad producida
  return totalCost / this.yield;
});

// Sobreescribir toJSON
recipeSchema.set('toJSON', { virtuals: true });
recipeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Recipe', recipeSchema);