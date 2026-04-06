const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const Category = require('../models/Category');
const Branch = require('../models/Branch');
const { protect, authorize } = require('../middlewares/auth');

/**
 * Rutas de Productos
 * GET: admin, manager, cajero, panadero
 * POST/PUT: admin, manager
 */

// GET /api/products - Listar todos
router.get('/', protect, async (req, res, next) => {
  try {
    const { category, branch, lowStock } = req.query;
    const filter = { isActive: true };
    
    if (category) filter.category = category;
    
    const products = await Product.find(filter)
      .populate('category', 'name')
      .populate('stock.branch', 'name')
      .sort({ name: 1 });
    
    // Filtrar por branch si se provee
    let result = products;
    if (branch) {
      result = products.map(p => ({
        ...p.toObject(),
        quantity: p.stock?.find(s => s.branch.toString() === branch)?.quantity || 0
      }));
    }
    
    // Filtrar stock bajo si se pide
    if (lowStock === 'true') {
      result = result.filter(p => {
        const qty = branch 
          ? p.quantity 
          : p.stock?.reduce((acc, s) => acc + s.quantity, 0) || 0;
        return qty <= p.minStock;
      });
    }
    
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

// POST /api/products - Crear
router.post('/', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { name, category, salePrice, minStock, sellBy, image } = req.body;
    
    // Obtener todas las sucursales activas para inicializar stock
    const branches = await Branch.find({ isActive: true });
    
    const stock = branches.map(b => ({
      branch: b._id,
      quantity: 0
    }));
    
    const product = await Product.create({
      name,
      category,
      salePrice,
      productionCost: 0, // Se calcula desde la receta
      stock,
      minStock: minStock || 0,
      sellBy: sellBy || 'unidad',
      image,
    });
    
    await product.populate('category', 'name');
    res.status(201).json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// GET /api/products/:id - Obtener por ID
router.get('/:id', protect, async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name')
      .populate('stock.branch', 'name');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// PUT /api/products/:id - Actualizar
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { name, category, salePrice, minStock, sellBy, image } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { name, category, salePrice, minStock, sellBy, image },
      { new: true, runValidators: true }
    ).populate('category', 'name');
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// PATCH /api/products/:id/adjust - Ajuste manual de stock
router.patch('/:id/adjust', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { branch, quantity, operation } = req.body; // operation: 'add', 'subtract' o 'set'
    
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    // Buscar o crear entrada de stock para esa sucursal
    let stockEntry = product.stock.find(s => s.branch.toString() === branch);
    
    if (!stockEntry) {
      stockEntry = { branch, quantity: 0 };
      product.stock.push(stockEntry);
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
    
    await product.save();
    await product.populate('category', 'name');
    await product.populate('stock.branch', 'name');
    
    res.json({ success: true, data: product });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/products/:id - Eliminar (soft delete)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );
    
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    res.json({ success: true, message: 'Producto eliminado' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;