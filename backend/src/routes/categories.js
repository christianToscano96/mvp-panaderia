const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect, authorize } = require('../middlewares/auth');

/**
 * Rutas de Categorías
 * GET: cualquier usuario
 * POST/PUT/DELETE: admin y manager
 */

// GET /api/categories - Listar todas
router.get('/', protect, async (req, res, next) => {
  try {
    const { appliesTo } = req.query;
    const filter = { isActive: true };
    if (appliesTo) filter.appliesTo = appliesTo;
    
    const categories = await Category.find(filter).sort({ name: 1 });
    res.json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
});

// POST /api/categories - Crear
router.post('/', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { name, description, appliesTo } = req.body;
    const category = await Category.create({ name, description, appliesTo });
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

// GET /api/categories/:id - Obtener por ID
router.get('/:id', protect, async (req, res, next) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

// PUT /api/categories/:id - Actualizar
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { name, description, appliesTo } = req.body;
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { name, description, appliesTo },
      { new: true, runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/categories/:id - Eliminar (soft delete)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const category = await Category.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Categoría no encontrada' });
    }
    res.json({ success: true, message: 'Categoría eliminada' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;