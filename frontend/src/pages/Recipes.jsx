import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getRecipes, createRecipe, updateRecipe } from '../api/recipes';
import { getProducts } from '../api/products';
import { getRawMaterials } from '../api/rawMaterials';

export default function Recipes() {
  const { user } = useAuth();
  const isAdminOrManager = ['admin', 'manager'].includes(user?.role);
  const queryClient = useQueryClient();
  
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [form, setForm] = useState({
    yield: 1,
    yieldUnit: 'unidad',
    ingredients: [],
    instructions: '',
    prepTime: 0,
  });

  // Cargar recetas
  const { data: recipeResult, isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => getRecipes(),
  });
  const recipes = recipeResult?.data || [];

  // Cargar todos los productos
  const { data: productResult, isLoading: loadingProducts } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => getProducts(),
  });
  const allProducts = productResult?.data || [];
  
  // Filtrar productos que ya tienen receta
  const productsWithRecipe = recipes.map(r => r.product?._id || r.product);
  const availableProducts = allProducts.filter(p => !productsWithRecipe.includes(p._id));

  // Cargar todas las materias primas
  const { data: matResult, isLoading: loadingMaterials } = useQuery({
    queryKey: ['rawMaterials-list'],
    queryFn: () => getRawMaterials(),
  });
  const rawMaterials = matResult?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: createRecipe,
    onSuccess: () => {
      queryClient.invalidateQueries(['recipes']);
      queryClient.invalidateQueries(['products']);
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateRecipe(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['recipes']);
      queryClient.invalidateQueries(['products']);
      closeModal();
    },
  });

  const openNew = (product = null) => {
    setEditing(null);
    setSelectedProduct(product?._id || '');
    setForm({
      yield: product?.yield || 1,
      yieldUnit: product?.yieldUnit || 'unidad',
      ingredients: [],
      instructions: '',
      prepTime: product?.prepTime || 0,
    });
    setShowModal(true);
  };

  const openEdit = (recipe) => {
    setEditing(recipe._id);
    setSelectedProduct(recipe.product?._id || recipe.product);
    setForm({
      yield: recipe.yield,
      yieldUnit: recipe.yieldUnit,
      ingredients: recipe.ingredients.map(i => ({
        rawMaterial: i.rawMaterial?._id || i.rawMaterial,
        quantity: i.quantity,
        unit: i.unit,
      })),
      instructions: recipe.instructions || '',
      prepTime: recipe.prepTime || 0,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setSelectedProduct('');
    setForm({ yield: 1, yieldUnit: 'unidad', ingredients: [], instructions: '', prepTime: 0 });
  };

  const addIngredient = () => {
    setForm({
      ...form,
      ingredients: [...form.ingredients, { rawMaterial: '', quantity: 0, unit: 'kg' }],
    });
  };

  const removeIngredient = (index) => {
    const newIngredients = [...form.ingredients];
    newIngredients.splice(index, 1);
    setForm({ ...form, ingredients: newIngredients });
  };

  const updateIngredient = (index, field, value) => {
    const newIngredients = [...form.ingredients];
    newIngredients[index][field] = value;
    setForm({ ...form, ingredients: newIngredients });
  };

  const calculateCost = () => {
    let totalCost = 0;
    for (const ing of form.ingredients) {
      const mat = rawMaterials.find(m => m._id === ing.rawMaterial);
      if (mat) {
        totalCost += (mat.costPerUnit || 0) * ing.quantity;
      }
    }
    return form.yield > 0 ? totalCost / form.yield : 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = {
      product: selectedProduct,
      ...form,
    };
    if (editing) {
      updateMutation.mutate({ id: editing, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const selectedProductData = allProducts.find(p => p._id === selectedProduct);

  if (isLoading || loadingProducts || loadingMaterials) return <div className="p-4">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Recetas</h1>
        {isAdminOrManager && availableProducts.length > 0 && (
          <button 
            onClick={() => openNew(availableProducts[0])} 
            className="btn btn-primary"
          >
            + Nueva Receta
          </button>
        )}
      </div>

      {/* Lista de recetas */}
      <div className="space-y-4">
        {recipes.map(recipe => (
          <div key={recipe._id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{recipe.product?.name}</h3>
                <p className="text-sm text-gray-500">
                  Rinde: {recipe.yield} {recipe.yieldUnit}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Costo de producción: <span className="font-medium">${recipe.product?.productionCost?.toFixed(2)}</span>
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <p className="font-medium">Ingredientes:</p>
                  <ul className="mt-1 space-y-1">
                    {recipe.ingredients?.map((ing, idx) => (
                      <li key={idx} className="text-gray-500">
                        • {ing.rawMaterial?.name}: {ing.quantity} {ing.unit}
                      </li>
                    ))}
                  </ul>
                </div>
                {recipe.instructions && (
                  <p className="text-sm text-gray-500 mt-2 italic">{recipe.instructions}</p>
                )}
              </div>
              {isAdminOrManager && (
                <button 
                  onClick={() => openEdit(recipe)} 
                  className="text-sm text-primary hover:underline"
                >
                  Editar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {recipes.length === 0 && (
        <p className="text-gray-500 text-center py-8">No hay recetas</p>
      )}

      {/* Modal Crear/Editar Receta */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editing ? 'Editar Receta' : 'Nueva Receta'}
            </h2>
            
            {/* Selector de producto (solo cuando no hay selección) */}
            {!editing && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Producto</label>
                <select
                  value={selectedProduct}
                  onChange={(e) => {
                    setSelectedProduct(e.target.value);
                    const prod = allProducts.find(p => p._id === e.target.value);
                    if (prod) {
                      setForm({ ...form, yield: 1, yieldUnit: prod.sellBy || 'unidad' });
                    }
                  }}
                  className="input"
                  required
                >
                  <option value="">Seleccionar producto</option>
                  {availableProducts.map(p => (
                    <option key={p._id} value={p._id}>{p.name}</option>
                  ))}
                </select>
              </div>
            )}

            {selectedProduct && (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Yield */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Rinde</label>
                    <input
                      type="number"
                      min="1"
                      value={form.yield}
                      onChange={(e) => setForm({...form, yield: parseInt(e.target.value) || 1})}
                      className="input"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-sm font-medium mb-1">Unidad</label>
                    <select
                      value={form.yieldUnit}
                      onChange={(e) => setForm({...form, yieldUnit: e.target.value})}
                      className="input"
                    >
                      <option value="unidad">Unidad</option>
                      <option value="kg">Kg</option>
                      <option value="docena">Docena</option>
                    </select>
                  </div>
                </div>

                {/* Tiempo de preparación */}
                <div>
                  <label className="block text-sm font-medium mb-1">Tiempo de preparación (minutos)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.prepTime}
                    onChange={(e) => setForm({...form, prepTime: parseInt(e.target.value) || 0})}
                    className="input"
                  />
                </div>

                {/* Ingredientes */}
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium">Ingredientes</label>
                    <button
                      type="button"
                      onClick={addIngredient}
                      className="text-sm text-primary hover:underline"
                    >
                      + Agregar ingrediente
                    </button>
                  </div>
                  <div className="space-y-2">
                    {form.ingredients.map((ing, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <select
                          value={ing.rawMaterial}
                          onChange={(e) => updateIngredient(idx, 'rawMaterial', e.target.value)}
                          className="input flex-1"
                          required
                        >
                          <option value="">Seleccionar</option>
                          {rawMaterials.map(m => (
                            <option key={m._id} value={m._id}>{m.name} ({m.unit})</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={ing.quantity}
                          onChange={(e) => updateIngredient(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="input w-24"
                          placeholder="Cantidad"
                          required
                        />
                        <select
                          value={ing.unit}
                          onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                          className="input w-20"
                        >
                          <option value="kg">kg</option>
                          <option value="g">g</option>
                          <option value="l">l</option>
                          <option value="ml">ml</option>
                          <option value="unidad">unid</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeIngredient(idx)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Costo calculado */}
                <div className="bg-gray-50 p-3 rounded">
                  <p className="text-sm text-gray-600">Costo por unidad producida</p>
                  <p className="text-xl font-bold text-green-600">${calculateCost().toFixed(2)}</p>
                </div>

                {/* Instrucciones */}
                <div>
                  <label className="block text-sm font-medium mb-1">Instrucciones</label>
                  <textarea
                    value={form.instructions}
                    onChange={(e) => setForm({...form, instructions: e.target.value})}
                    className="input"
                    rows={3}
                    placeholder="Pasos de preparación..."
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button type="submit" className="btn btn-primary flex-1">
                    {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button type="button" onClick={closeModal} className="btn btn-secondary">
                    Cancelar
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}