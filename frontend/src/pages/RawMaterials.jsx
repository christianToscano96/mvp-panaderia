import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getRawMaterials, createRawMaterial, updateRawMaterial, adjustStock } from '../api/rawMaterials';
import { getCategories } from '../api/categories';
import { getBranches } from '../api/branches';

export default function RawMaterials() {
  const { user } = useAuth();
  const isAdminOrManager = ['admin', 'manager'].includes(user?.role);
  const queryClient = useQueryClient();
  
  const [showModal, setShowModal] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [adjusting, setAdjusting] = useState(null);
  const [adjustingMat, setAdjustingMat] = useState(null); // materialize actual para mostrar stock actual
  const [form, setForm] = useState({ name: '', category: '', unit: 'kg', costPerUnit: 0, minStock: 0 });
  const [stockForm, setStockForm] = useState({ branch: '', quantity: 0, operation: 'set' });
  const [filterCategory, setFilterCategory] = useState('');

  // Cargar categorías para el filtro
  const { data: catResult } = useQuery({
    queryKey: ['categories', 'todos'],
    queryFn: () => getCategories(),
  });
  const categories = catResult?.data || [];

  // Cargar sucursales (siempre para admin/manager que pueden elegir sucursal)
  const { data: branchResult } = useQuery({
    queryKey: ['branches'],
    queryFn: () => getBranches(),
  });
  const allBranches = branchResult?.data || [];
  // Filtrar solo las necesarias para el rol
  const accessibleBranches = isAdminOrManager ? allBranches : [];
  const branches = branchResult?.data || [];

  // Cargar materias primas - admin ve todas, manager/cajero ve la suya
  const userBranchId = user?.role === 'admin' ? null : user?.branch?._id;
  const { data: matResult, isLoading } = useQuery({
    queryKey: ['rawMaterials', filterCategory, userBranchId],
    queryFn: () => getRawMaterials({ 
      ...(filterCategory && { category: filterCategory }),
      ...(userBranchId && { branch: userBranchId }),
    }),
  });
  const materials = matResult?.data || [];

  // Mutations
  const createMutation = useMutation({
    mutationFn: createRawMaterial,
    onSuccess: () => queryClient.invalidateQueries(['rawMaterials']),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateRawMaterial(id, data),
    onSuccess: () => queryClient.invalidateQueries(['rawMaterials']),
  });

  const stockMutation = useMutation({
    mutationFn: ({ id, data }) => adjustStock(id, data),
    onSuccess: () => queryClient.invalidateQueries(['rawMaterials']),
  });

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', category: '', unit: 'kg', costPerUnit: 0, minStock: 0 });
    setShowModal(true);
  };

  const openEdit = (mat) => {
    setEditing(mat._id);
    setForm({ 
      name: mat.name, 
      category: mat.category?._id || mat.category, 
      unit: mat.unit, 
      costPerUnit: mat.costPerUnit, 
      minStock: mat.minStock 
    });
    setShowModal(true);
  };

  const openStock = (mat) => {
    setAdjusting(mat._id);
    setAdjustingMat(mat);
    // Si es admin/manager, usar primera sucursal accessible o la del usuario
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
        <h1 className="text-2xl font-bold text-gray-800">Materia Prima</h1>
        {isAdminOrManager && (
          <button onClick={openNew} className="btn btn-primary">
            + Nueva Materia Prima
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
              <th className="px-4 py-2 text-left text-sm font-medium">Unidad</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Costo</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Stock</th>
              <th className="px-4 py-2 text-left text-sm font-medium">Mín</th>
              {isAdminOrManager && <th className="px-4 py-2 text-left text-sm font-medium">Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {materials.map(mat => {
              // Admin no filtra por branch -> tiene array stock; manager/cajero filtra -> tiene quantity directo
              // Si es admin, mostrar el stock de la primera sucursal o el total
              let qty;
              if (mat.quantity !== undefined) {
                qty = mat.quantity; // tiene quantity directa (manager/cajero)
              } else if (user?.role === 'admin' && mat.stock?.length > 0) {
                qty = mat.stock[0].quantity; // admin ve la primera sucursal
              } else {
                qty = 0;
              }
              const isLow = qty <= mat.minStock;
              
              return (
                <tr key={mat._id} className="border-t border-gray-100">
                  <td className="px-4 py-2">{mat.name}</td>
                  <td className="px-4 py-2">{mat.category?.name}</td>
                  <td className="px-4 py-2">{mat.unit}</td>
                  <td className="px-4 py-2">${mat.costPerUnit}/{mat.unit}</td>
                  <td className={`px-4 py-2 font-medium ${isLow ? 'text-red-600' : ''}`}>
                    {qty} {mat.unit}
                  </td>
                  <td className="px-4 py-2">{mat.minStock}</td>
                  {isAdminOrManager && (
                    <td className="px-4 py-2">
                      <button onClick={() => openStock(mat)} className="text-sm text-primary hover:underline mr-2">
                        Stock
                      </button>
                      <button onClick={() => openEdit(mat)} className="text-sm text-gray-500 hover:underline">
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

      {materials.length === 0 && (
        <p className="text-gray-500 text-center py-8">No hay materia prima</p>
      )}

      {/* Modal Crear/Editar */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editing ? 'Editar Materia Prima' : 'Nueva Materia Prima'}
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
                <label className="block text-sm font-medium mb-1">Unidad</label>
                <select
                  value={form.unit}
                  onChange={(e) => setForm({...form, unit: e.target.value})}
                  className="input"
                >
                  <option value="kg">kg</option>
                  <option value="g">g</option>
                  <option value="l">l</option>
                  <option value="ml">ml</option>
                  <option value="unidad">unidad</option>
                  <option value="docena">docena</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Costo por unidad</label>
                <input
                  type="number"
                  step="0.01"
                  value={form.costPerUnit}
                  onChange={(e) => setForm({...form, costPerUnit: parseFloat(e.target.value)})}
                  className="input"
                  required
                />
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
      {showStockModal && adjustingMat && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Ajustar Stock</h2>
            <div className="text-sm text-gray-600 mb-4">
              <p className="font-medium text-gray-800">{adjustingMat.name}</p>
              <p>Unidad: {adjustingMat.unit}</p>
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
                    const current = adjustingMat.stock?.find(s => s.branch === stockForm.branch || s.branch?._id === stockForm.branch);
                    return current?.quantity || 0;
                  })()} {adjustingMat.unit}
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
                    const current = adjustingMat.stock?.find(s => s.branch === stockForm.branch || s.branch?._id === stockForm.branch);
                    const currentQty = current?.quantity || 0;
                    let newQty = currentQty;
                    if (stockForm.operation === 'set') newQty = stockForm.quantity;
                    else if (stockForm.operation === 'add') newQty = currentQty + stockForm.quantity;
                    else if (stockForm.operation === 'subtract') newQty = Math.max(0, currentQty - stockForm.quantity);
                    return newQty;
                  })()} {adjustingMat.unit}
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