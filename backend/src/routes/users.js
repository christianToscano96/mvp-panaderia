const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const userController = require('../controllers/userController');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

/**
 * Middlewares aplicados a todas las rutas
 */
router.use(protect);
router.use(authorize('admin'));

/**
 * Validaciones para crear usuario
 */
const validateCreate = [
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
    .isMongoId()
    .withMessage('ID de sucursal inválido')
];

/**
 * Validaciones para actualizar usuario
 */
const validateUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2 y 100 caracteres'),
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Email inválido')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['admin', 'manager', 'cajero', 'panadero'])
    .withMessage('Rol inválido'),
  body('branch')
    .optional()
    .isMongoId()
    .withMessage('ID de sucursal inválido'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive debe ser booleano')
];

/**
 * Rutas CRUD
 */

// GET /api/users - Listar todos
router.get('/', userController.getAll);

// GET /api/users/:id - Obtener por ID
router.get('/:id', param('id').isMongoId().withMessage('ID inválido'), validate, userController.getById);

// POST /api/users - Crear
router.post('/', validateCreate, validate, userController.create);

// PUT /api/users/:id - Actualizar
router.put('/:id', param('id').isMongoId().withMessage('ID inválido'), validateUpdate, validate, userController.update);

// PATCH /api/users/:id/toggle - Activar/desactivar
router.patch('/:id/toggle', param('id').isMongoId().withMessage('ID inválido'), validate, userController.toggle);

// PATCH /api/users/:id/password - Cambiar password
router.patch('/:id/password', 
  param('id').isMongoId().withMessage('ID inválido'),
  body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
  body('newPassword').isLength({ min: 6 }).withMessage('Nueva contraseña debe tener al menos 6 caracteres'),
  validate,
  userController.updatePassword
);

module.exports = router;