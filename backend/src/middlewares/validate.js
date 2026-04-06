const { validationResult } = require('express-validator');

/**
 * Middleware: validate
 * Revisa resultados de express-validator
 * 
 * Debe usarse DESPUÉS de las validaciones en la ruta
 * 
 * @example
 * router.post('/login', validateLogin, validate, authController.login)
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Datos inválidos',
      errors: errors.array().map(err => ({
        field: err.path,
        message: err.msg
      }))
    });
  }
  
  next();
};

module.exports = validate;