const mongoose = require('mongoose');

/**
 * Modelo de Sucursal para Panadería App
 * 
 * Cada sucursal maneja stock independiente
 */
const branchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    unique: true,
    trim: true
  },
  address: {
    type: String,
    required: [true, 'La dirección es requerida'],
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

//Virtual: Nombre corto
branchSchema.virtual('displayName').get(function() {
  return this.name;
});

module.exports = mongoose.model('Branch', branchSchema);