const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Middleware: authenticate
 * Verifica JWT y adjunta usuario a req.user
 *
 * Expects: Authorization: Bearer <token>
 */
const protect = async (req, res, next) => {
  let token;

  // 1. Extraer token del header
  if (req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'No autorizado, token no proporcionado'
    });
  }

  try {
    // 2. Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Buscar usuario en DB (excluir password)
    const user = await User.findById(decoded.id).select('+password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // 4. Verificar que esté activo
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Usuario desactivado'
      });
    }

    // 5. Adjuntar a request
    req.user = user;
    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado'
    });
  }
};

/**
 * Middleware: authorize
 * Verifica que el usuario tenga el rol requerido
 * 
 * @param {...string} roles - Roles permitidos
 *
 * @example
 * router.post('/admin', protect, authorize('admin'), controller)
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Acceso denegado. Rol requerido: ${roles.join(' o ')}`
      });
    }

    next();
  };
};

/**
 * Generar JWT token
 * @param {ObjectId} userId - ID del usuario
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
};

module.exports = {
  protect,
  authorize,
  generateToken
};