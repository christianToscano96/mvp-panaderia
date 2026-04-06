const express = require('express');
const router = express.Router();
const Recipe = require('../models/Recipe');
const Product = require('../models/Product');
const RawMaterial = require('../models/RawMaterial');
const { protect, authorize } = require('../middlewares/auth');

/**
 * Rutas de Recetas
 * GET: admin, manager, panadero
 * POST/PUT: admin, manager
 */

// GET /api/recipes - Listar todas
router.get('/', protect, async (req, res, next) => {
  try {
    const { productId } = req.query;
    const filter = { isActive: true };
    
    if (productId) filter.product = productId;
    
    const recipes = await Recipe.find(filter)
      .populate('product', 'name salePrice productionCost')
      .populate('ingredients.rawMaterial', 'name unit costPerUnit')
      .sort({ 'product.name': 1 });
    
    res.json({ success: true, data: recipes });
  } catch (error) {
    next(error);
  }
});

// GET /api/recipes/:productId - Ver receta de un producto
router.get('/:productId', protect, async (req, res, next) => {
  try {
    const recipe = await Recipe.findOne({ product: req.params.productId, isActive: true })
      .populate('product', 'name yield yieldUnit')
      .populate('ingredients.rawMaterial', 'name unit category costPerUnit');
    
    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Receta no encontrada para este producto' });
    }
    
    res.json({ success: true, data: recipe });
  } catch (error) {
    next(error);
  }
});

// POST /api/recipes - Crear receta
router.post('/', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { product: productId, yield: recipeYield, yieldUnit, ingredients, instructions, prepTime } = req.body;
    
    // Verificar que el producto existe
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Producto no encontrado' });
    }
    
    // Verificar que no existe receta para este producto
    const existing = await Recipe.findOne({ product: productId, isActive: true });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Ya existe una receta para este producto. Usá PUT para editar.' });
    }
    
    // Calcular costo de producción
    let productionCost = 0;
    for (const ing of ingredients) {
      const rawMaterial = await RawMaterial.findById(ing.rawMaterial);
      if (rawMaterial) {
        productionCost += rawMaterial.costPerUnit * ing.quantity;
      }
    }
    const calculatedCostPerUnit = productionCost / recipeYield;
    
    // Crear receta
    const recipe = await Recipe.create({
      product: productId,
      yield: recipeYield,
      yieldUnit,
      ingredients,
      instructions,
      prepTime,
    });
    
    // Actualizar el costo de producción del producto
    await Product.findByIdAndUpdate(productId, { productionCost: calculatedCostPerUnit });
    
    await recipe.populate('product', 'name');
    await recipe.populate('ingredients.rawMaterial', 'name unit');
    
    res.status(201).json({ success: true, data: recipe });
  } catch (error) {
    next(error);
  }
});

// PUT /api/recipes/:id - Actualizar receta
router.put('/:id', protect, authorize('admin', 'manager'), async (req, res, next) => {
  try {
    const { yield: recipeYield, yieldUnit, ingredients, instructions, prepTime } = req.body;
    
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Receta no encontrada' });
    }
    
    // Calcular nuevo costo de producción
    let productionCost = 0;
    for (const ing of ingredients) {
      const rawMaterial = await RawMaterial.findById(ing.rawMaterial);
      if (rawMaterial) {
        productionCost += rawMaterial.costPerUnit * ing.quantity;
      }
    }
    const calculatedCostPerUnit = productionCost / recipeYield;
    
    // Actualizar receta
    recipe.yield = recipeYield;
    recipe.yieldUnit = yieldUnit;
    recipe.ingredients = ingredients;
    recipe.instructions = instructions;
    recipe.prepTime = prepTime;
    await recipe.save();
    
    // Actualizar costo de producción del producto
    await Product.findByIdAndUpdate(recipe.product, { productionCost: calculatedCostPerUnit });
    
    await recipe.populate('product', 'name');
    await recipe.populate('ingredients.rawMaterial', 'name unit');
    
    res.json({ success: true, data: recipe });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/recipes/:id - Eliminar (soft delete)
router.delete('/:id', protect, authorize('admin'), async (req, res, next) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) {
      return res.status(404).json({ success: false, message: 'Receta no encontrada' });
    }
    
    // Soft delete
    recipe.isActive = false;
    await recipe.save();
    
    // Limpiar costo de producción del producto
    await Product.findByIdAndUpdate(recipe.product, { productionCost: 0 });
    
    res.json({ success: true, message: 'Receta eliminada' });
  } catch (error) {
    next(error);
  }
});

module.exports = router;