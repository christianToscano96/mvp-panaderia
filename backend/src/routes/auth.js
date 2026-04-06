const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const authController = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

/**
 * Validaciones para login
 */
const validateLogin = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Contraseña requerida')
];

/**
 * Validaciones para registro
 */
const validateRegister = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Contraseña debe tener al menos 6 caracteres'),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'cajero', 'panadero'])
    .withMessage('Rol inválido'),
  body('branch')
    .optional()
    .isMongoId()
    .withMessage('ID de sucursal inválido')
];

/**
 * Rutas públicas
 */

// POST /api/auth/login - Iniciar sesión
router.post('/login', validateLogin, validate, authController.login);

// POST /api/auth/register - Registrar usuario (solo admin)
router.post('/register', validateRegister, validate, authController.register);

/**
 * Rutas protegidas
 */

// GET /api/auth/me - Obtener usuario actual
router.get('/me', protect, authController.me);

module.exports = router;