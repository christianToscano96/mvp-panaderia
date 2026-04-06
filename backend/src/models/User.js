const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

/**
 * Modelo de Usuario para Panadería App
 * 
 * Roles:
 * - admin: acceso total
 * - manager: encargado de sucursal
 * - cajero: punto de venta
 * - panadero: producción
 */
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [100, 'Máximo 100 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: [true, 'La contraseña es requerida'],
    minlength: [6, 'Mínimo 6 caracteres'],
    select: false // Nunca mostrar en queries
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'cajero', 'panadero'],
    default: 'cajero'
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: [true, 'La sucursal es requerida']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true,
  
  // Virtuals en JSON
  toJSON: {
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.__v;
      return ret;
    }
  }
});

// Índice único compuesto: email + isActive para búsquedas rápidas
userSchema.index({ email: 1, isActive: 1 });

/**
 * Pre-save hook: hashear password
 * Solo ejecuta si el password fue modificado
 */
userSchema.pre('save', async function() {
  // Si no es modificación, salir
  if (!this.isModified('password')) return;
  
  // Hashear con salt 12
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Método de instancia: comparar password
 * @param {string} candidatePassword - Password a comparar
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * Virtual: nombre corto para display
 */
userSchema.virtual('displayName').get(function() {
  return this.name.split(' ')[0];
});

module.exports = mongoose.model('User', userSchema);