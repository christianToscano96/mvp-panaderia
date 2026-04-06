import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getProducts, createProduct, updateProduct, adjustStock } from '../api/products';
import { getCategories } from '../api/categories';
import { getBranches } from '../api/branches';

export default function Products() {
  const { user } = useAuth();
  const isAdminOrManager = ['admin', 'manager'].includes(user?.role);
  const queryClient = useQueryClient();
  
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [adjusting, setAdjusting] = useState(null);
  const [adjustingProd, setAdjustingProd] = useState(null);
  const [form, setForm] = useState({ name: '', category: '', salePrice: 0, minStock: 0, sellBy: 'unidad' });
  const [stockForm, setStockForm] = useState({ branch: '', quantity: 0, operation: 'set' });
  const [filterCategory, setFilterCategory] = useState('');

  // Cargar categorías (para productos)
  const { data: catResult } = useQuery({
    queryKey: ['categories', 'productos'],
    queryFn: () => getCategories(),
  });
  const categories = catResult?.data || [];

  // Cargar sucursales
  const { data: branchResult } = useQuery({
    queryKey: ['branches'],
    queryFn: () => getBranches(),
  });
  const allBranches = branchResult?.data || [];
  const accessibleBranches = isAdminOrManager ? allBranches : [];

  // Cargar productos
  const userBranchId = user?.role === 'admin' ? null : user?.branch?._id;
  const { data: prodResult, isLoading } = useQuery({
    queryKey: ['products', filterCategory, userBranchId],
    queryFn: () => getProducts({ 
      ...(filterCategory && { category: filterCategory }),
      ...(userBranchId && { branch: userBranchId }),
    }),
  });
  const products = prodResult?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: createProduct,
    onSuccess: () => queryClient.invalidateQueries(['products']),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateProduct(id, data),
    onSuccess: () => queryClient.invalidateQueries(['products']),
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, data }) => adjustStock(id, data),
    onSuccess: () => queryClient.invalidateQueries(['products']),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', category: '', salePrice: 0, minStock: 0, sellBy: 'unidad' });
    setShowModal(true);
  };

  const openEdit = (prod) => {
    setEditing(prod._id);
    setForm({ 
      name: prod.name, 
      category: prod.category?._id || prod.category, 
      salePrice: prod.salePrice, 
      minStock: prod.minStock,
      sellBy: prod.sellBy || 'unidad',
    });
    setShowModal(true);
  };

  const openStock = (prod) => {
    setAdjusting(prod._id);
    setAdjustingProd(prod);
    const defaultBranch = isAdminOrManager && accessibleBranches.length > 0
      ? (accessibleBranches[0]?._id || user?.branch?._id)
      : user?.branch?._id;
    setStockForm({ branch: defaultBranch || '', quantity: 0, operation: 'set' });
    setShowStockModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) {
      updateMutation.mutate({ id: editing, data: form });
    } else {
      createMutation.mutate(form);
    }
    setShowModal(false);
  };

  const handleStockSubmit = (e) => {
    e.preventDefault();
    stockMutation.mutate({ id: adjusting, data: stockForm });
    setShowStockModal(false);
  };

  if (isLoading) return <div className="p-4">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Productos</h1>
        {isAdminOrManager && (
          <button onClick={openNew} className="btn btn-primary">
            + Nuevo Producto
          </button>
        )}
      </div>

      {/* Filtro por categoría */}
      <div className="mb-4">
        <select 
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="input w-48"
        >
          <option value="">Todas las categorías</option>
          {categories.map(c => (
            <option key={c._id} value={c._id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Lista */}
      <div className="overflow-x-auto">
        <table className="w-full bg-white rounded-lg">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium">Nombre</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Categoría</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Precio</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Stock</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Mín</th>
              {isAdminOrManager && <th className="px-4 py-2 text-left text-sm font-medium">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {products.map(prod => {
              let qty;
              if (prod.quantity !== undefined) {
                qty = prod.quantity;
              } else if (user?.role === 'admin' && prod.stock?.length > 0) {
                qty = prod.stock[0].quantity;
              } else {
                qty = 0;
              }
              const isLow = qty <= prod.minStock;
              
              return (
                <tr key={prod._id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{prod.name}</td>
                  <td className="px-4 py-2">{prod.category?.name}</td>
                  <td className="px-4 py-2">${prod.salePrice}</td>
                  <td className={`px-4 py-2 font-medium ${isLow ? 'text-red-600' : ''}`}>
                    {qty} {prod.sellBy}
                  </td>
                  <td className="px-4 py-2">{prod.minStock}</td>
                  {isAdminOrManager && (
                    <td className="px-4 py-2">
                      <button onClick={() => openStock(prod)} className="text-sm text-primary hover:underline mr-2">
                        Stock
                      </button>
                      <button onClick={() => openEdit(prod)} className="text-sm text-gray-500 hover:underline">
                        Editar
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {products.length === 0 && (
        <p className="text-gray-500 text-center py-8">No hay productos</p>
      )}

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editing ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Categoría</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({...form, category: e.target.value})}
                  className="input"
                  required
                >
                  <option value="">Seleccionar</option>
                  {categories.map(c => (
                    <option key={c._id} value={c._id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Precio de venta</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.salePrice}
                  onChange={(e) => setForm({...form, salePrice: parseFloat(e.target.value)})}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Se vende por</label>
                <select
                  value={form.sellBy}
                  onChange={(e) => setForm({...form, sellBy: e.target.value})}
                  className="input"
                >
                  <option value="unidad">Unidad</option>
                  <option value="kg">Kg</option>
                  <option value="docena">Docena</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Stock mínimo</label>
                <input
                  type="number"
                  value={form.minStock}
                  onChange={(e) => setForm({...form, minStock: parseFloat(e.target.value)})}
                  className="input"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn btn-primary flex-1">
                  {createMutation.isPending || updateMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Ajuste Stock */}
      {showStockModal && adjustingProd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Ajustar Stock</h2>
            <div className="text-sm text-gray-600 mb-4">
              <p className="font-medium text-gray-800">{adjustingProd.name}</p>
              <p>Se vende por: {adjustingProd.sellBy}</p>
            </div>
            
            <form onSubmit={handleStockSubmit} className="space-y-4">
              {/* Selector de sucursal (para admin y manager) */}
              {isAdminOrManager && (
                <div>
                  <label className="block text-sm font-medium mb-1">Sucursal</label>
                  <select
                    value={stockForm.branch}
                    onChange={(e) => setStockForm({...stockForm, branch: e.target.value, quantity: 0})}
                    className="input"
                  >
                    {accessibleBranches.filter(b => b.isActive !== false).map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}
              
              {/* Stock actual */}
              <div className="bg-gray-50 p-3 rounded">
                <p className="text-sm text-gray-600">Stock actual</p>
                <p className="text-lg font-semibold">
                  {(() => {
                    const current = adjustingProd.stock?.find(s => s.branch === stockForm.branch || s.branch?._id === stockForm.branch);
                    return current?.quantity || 0;
                  })()} {adjustingProd.sellBy}
                </p>
              </div>
              
              {/* Operación */}
              <div>
                <label className="block text-sm font-medium mb-1">Operación</label>
                <select
                  value={stockForm.operation}
                  onChange={(e) => setStockForm({...stockForm, operation: e.target.value, quantity: 0})}
                  className="input"
                >
                  <option value="set">Set (definir valor)</option>
                  <option value="add">Add (+ agregar)</option>
                  <option value="subtract">Subtract (- quitar)</option>
                </select>
              </div>
              
              {/* Cantidad */}
              <div>
                <label className="block text-sm font-medium mb-1">
                  {stockForm.operation === 'set' ? 'Nuevo valor' : 'Cantidad'}
                </label>
                <input
                  type="number"
                  step="any"
                  min="0"
                  value={stockForm.quantity}
                  onChange={(e) => setStockForm({...stockForm, quantity: parseFloat(e.target.value) || 0})}
                  className="input"
                  required
                />
              </div>
              
              {/* Preview del stock nuevo */}
              <div className="bg-green-50 p-3 rounded border border-green-200">
                <p className="text-sm text-green-700">Stock nuevo</p>
                <p className="text-lg font-semibold text-green-800">
                  {(() => {
                    const current = adjustingProd.stock?.find(s => s.branch === stockForm.branch || s.branch?._id === stockForm.branch);
                    const currentQty = current?.quantity || 0;
                    let newQty = currentQty;
                    if (stockForm.operation === 'set') newQty = stockForm.quantity;
                    else if (stockForm.operation === 'add') newQty = currentQty + stockForm.quantity;
                    else if (stockForm.operation === 'subtract') newQty = Math.max(0, currentQty - stockForm.quantity);
                    return newQty;
                  })()} {adjustingProd.sellBy}
                </p>
              </div>
              
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn btn-primary flex-1">
                  {stockMutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setShowStockModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}