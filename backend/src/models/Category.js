const mongoose = require('mongoose');

/**
 * Modelo de Categoría para Panadería App
 * Clasifica materia prima y productos
 */
const categorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  appliesTo: {
    type: String,
    enum: ['materia_prima', 'producto', 'ambos'],
    default: 'producto'
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

module.exports = mongoose.model('Category', categorySchema);