const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();

const Branch = require('../models/Branch');
const { protect, authorize } = require('../middlewares/auth');
const validate = require('../middlewares/validate');

/**
 * Rutas de Sucursales
 * Solo admin puede crear/editar; cualquier usuario puede ver
 */

/**
 * GET /api/branches - Listar todas las sucursales
 */
router.get('/', protect, async (req, res, next) => {
  try {
    const branches = await Branch.find({ isActive: true }).sort({ name: 1 });
    
    res.json({
      success: true,
      data: branches
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/branches - Crear sucursal (solo admin)
 */
router.post('/', 
  protect,
  authorize('admin'),
  body('name').trim().notEmpty().withMessage('Nombre requerido'),
  body('address').trim().notEmpty().withMessage('Dirección requerida'),
  validate,
  async (req, res, next) => {
    try {
      const { name, address, phone } = req.body;
      
      const branch = await Branch.create({ name, address, phone });
      
      res.status(201).json({
        success: true,
        message: 'Sucursal creada',
        data: branch
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/branches/:id - Obtener por ID
 */
router.get('/:id', protect, param('id').isMongoId().withMessage('ID inválido'), validate, async (req, res, next) => {
  try {
    const branch = await Branch.findById(req.params.id);
    
    if (!branch) {
      return res.status(404).json({
        success: false,
        message: 'Sucursal no encontrada'
      });
    }
    
    res.json({
      success: true,
      data: branch
    });
  } catch (error) {
    next(error);
  }
});

/**
 * PUT /api/branches/:id - Actualizar (solo admin)
 */
router.put('/:id',
  protect,
  authorize('admin'),
  param('id').isMongoId().withMessage('ID inválido'),
  validate,
  async (req, res, next) => {
    try {
      const { name, address, phone } = req.body;
      
      const branch = await Branch.findByIdAndUpdate(
        req.params.id,
        { name, address, phone },
        { new: true, runValidators: true }
      );
      
      if (!branch) {
        return res.status(404).json({
          success: false,
          message: 'Sucursal no encontrada'
        });
      }
      
      res.json({
        success: true,
        message: 'Sucursal actualizada',
        data: branch
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;