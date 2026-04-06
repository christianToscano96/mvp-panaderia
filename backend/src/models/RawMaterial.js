const mongoose = require('mongoose');

/**
 * Modelo de Materia Prima para Panadería App
 * Stock se maneja POR SUCURSAL
 */
const rawMaterialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'La categoría es requerida']
  },
  unit: {
    type: String,
    enum: ['kg', 'g', 'l', 'ml', 'unidad', 'docena'],
    required: [true, 'La unidad es requerida']
  },
  costPerUnit: {
    type: Number,
    required: [true, 'El costo por unidad es requerido'],
    min: 0
  },
  // Stock por sucursal: [{ branch, quantity }]
  stock: [{
    branch: { type: mongoose.Schema.Types.ObjectId, ref: 'Branch' },
    quantity: { type: Number, default: 0, min: 0 }
  }],
  minStock: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true, transform: (doc, ret) => {
    delete ret.__v;
    return ret;
  }}
});

// Índice para búsquedas
rawMaterialSchema.index({ name: 1, isActive: 1 });
rawMaterialSchema.index({ category: 1 });

// Virtual: tiene stock bajo en alguna sucursal
rawMaterialSchema.virtual('hasLowStock').get(function() {
  return this.stock?.some(s => s.quantity <= this.minStock);
});

// Método: obtener stock en una sucursal específica
rawMaterialSchema.methods.getStockInBranch = function(branchId) {
  const entry = this.stock?.find(s => s.branch.toString() === branchId.toString());
  return entry?.quantity || 0;
};

module.exports = mongoose.model('RawMaterial', rawMaterialSchema);