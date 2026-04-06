const express = require('express');
const router = express.Router();
const RawMaterial = require('../models/RawMaterial');
const Branch = require('../models/Branch');
const { protect, authorize } = require('../middlewares/auth');

/**
 * Rutas de Materia Prima
 * GET: admin, manager, panadero
 * POST/PUT: admin, manager
 */

// GET /api/raw-materials - Listar todas
router.get('/', protect, async (req, res, next) => {
  try {
    const { category, branch, lowStock } = req.query;
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    
    const materials = await RawMaterial.find(filter)
      .populate('category', 'name')
      .populate('stock.branch', 'name')
      .sort({ name: 1 });
    
    // Filtrar por branch si se provee
    let result = materials;
    if (branch) {
      result = materials.map(m => ({
        ...m.toObject(),
        quantity: m.stock?.find(s => s.branch.toString() === branch)?.quantity || 0
      }));
    }
    
    // Filtrar stock bajo si se pide
    if (lowStock === 'true') {
      result = result.filter(m => {
        const qty = branch 
          ? m.quantity 
          : m.stock?.reduce((acc, s) => acc + s.quantity, 0) || 0;
        return qty <= m.minStock;
      });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/raw-materials - Crear
router.post('/', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { name, category, unit, costPerUnit, minStock } = req.body;
    
    // Obtener todas las sucursales activas para inicializar stock
    const branches = await Branch.find({ isActive: true });
    
    const stock = branches.map(b => ({
      branch: b._id,
      quantity: 0
    }));
    
    const material = await RawMaterial.create({
      name,
      category,
      unit,
      costPerUnit,
      minStock: minStock || 0,
      stock
    });
    
    await material.populate('category', 'name');
    res.status(201).json({ success: true, data: material });
  } catch (error) {
    next(error);
  }
});

// GET /api/raw-materials/:id - Obtener por ID
router.get('/:id', protect, async (req, res, next) => {
  try {
    const material = await RawMaterial.findById(req.params.id)
      .populate('category', 'name')
      .populate('stock.branch', 'name');
    
    if (!material) {
      return res.status(404).json({ success: false, message: 'Materia prima no encontrada' });
    }
    
    res.json({ success: true, data: material });
  } catch (error) {
    next(error);
  }
});

// PUT /api/raw-materials/:id - Actualizar
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { name, category, unit, costPerUnit, minStock } = req.body;
    
    const material = await RawMaterial.findByIdAndUpdate(
      req.params.id,
      { name, category, unit, costPerUnit, minStock },
      { new: true, runValidators: true }
    ).populate('category', 'name');
    
    if (!material) {
      return res.status(404).json({ success: false, message: 'Materia prima no encontrada' });
    }
    
    res.json({ success: true, data: material });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/raw-materials/:id/adjust - Ajuste manual de stock
router.patch('/:id/adjust', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { branch, quantity, operation } = req.body; // operation: 'add', 'subtract' o 'set'
    
    const material = await RawMaterial.findById(req.params.id);
    if (!material) {
      return res.status(404).json({ success: false, message: 'Materia prima no encontrada' });
    }
    
    // Buscar o crear entrada de stock para esa sucursal
    let stockEntry = material.stock.find(s => s.branch.toString() === branch);
    
    if (!stockEntry) {
      stockEntry = { branch, quantity: 0 };
      material.stock.push(stockEntry);
    }
    
    // Aplicar operación
    if (operation === 'set') {
      stockEntry.quantity = quantity;
    } else if (operation === 'add') {
      stockEntry.quantity += quantity;
    } else if (operation === 'subtract') {
      stockEntry.quantity = Math.max(0, stockEntry.quantity - quantity);
    } else {
      stockEntry.quantity = quantity;
    }
    
    // No permitir negativo (por seguridad)
    if (stockEntry.quantity < 0) stockEntry.quantity = 0;
    
    await material.save();
    await material.populate('category', 'name');
    await material.populate('stock.branch', 'name');
    
    res.json({ success: true, data: material });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/raw-materials/:id - Eliminar (soft delete)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const material = await RawMaterial.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!material) {
      return res.status(404).json({ success: false, message: 'Materia prima no encontrada' });
    }
    
    res.json({ success: true, message: 'Materia prima eliminada' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;