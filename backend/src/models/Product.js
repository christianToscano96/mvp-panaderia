const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  salePrice: {
    type: Number,
    required: true,
    min: 0,
  },
  productionCost: {
    type: Number,
    default: 0,
    min: 0,
  },
  stock: [{
    branch: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Branch',
    },
    quantity: {
      type: Number,
      default: 0,
      min: 0,
    },
  }],
  minStock: {
    type: Number,
    default: 0,
  },
  sellBy: {
    type: String,
    enum: ['unidad', 'kg', 'docena'],
    default: 'unidad',
  },
  image: {
    type: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Virtual: margen de ganancia
productSchema.virtual('profitMargin').get(function() {
  if (this.productionCost === 0) return 0;
  return ((this.salePrice - this.productionCost) / this.productionCost) * 100;
});

// Virtual: verificar stock bajo
productSchema.virtual('hasLowStock').get(function() {
  return this.stock?.some(s => s.quantity <= this.minStock);
});

// Sobreescribir toJSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Product', productSchema);