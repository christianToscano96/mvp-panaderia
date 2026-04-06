import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories';

export default function Categories() {
  const { user } = useAuth();
  const isAdminOrManager = ['admin', 'manager'].includes(user?.role);
  const queryClient = useQueryClient();
  
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: '', description: '', appliesTo: 'producto' });
  const [filter, setFilter] = useState('todos');

  const { data: result, isLoading } = useQuery({
    queryKey: ['categories', filter],
    queryFn: () => getCategories(filter === 'todos' ? undefined : filter),
  });

  const categories = result?.data || [];

  const mutation = useMutation({
    mutationFn: (data) => editing 
      ? updateCategory(editing, data)
      : createCategory(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['categories']);
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCategory,
    onSuccess: () => queryClient.invalidateQueries(['categories']),
  });

  const openEdit = (cat) => {
    setEditing(cat._id);
    setForm({ name: cat.name, description: cat.description || '', appliesTo: cat.appliesTo });
    setShowModal(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm({ name: '', description: '', appliesTo: 'producto' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
    setForm({ name: '', description: '', appliesTo: 'producto' });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  const handleDelete = (id) => {
    if (confirm('¿Eliminar categoría?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div className="p-4">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Categorías</h1>
        {isAdminOrManager && (
          <button onClick={openNew} className="btn btn-primary">
            + Nueva Categoría
          </button>
        )}
      </div>

      {/* Filtro */}
      <div className="flex gap-2 mb-4">
        {['todos', 'producto', 'materia_prima', 'ambos'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-md text-sm ${
              filter === f ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {f === 'todos' ? 'Todos' : f.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat._id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{cat.name}</h3>
                {cat.description && <p className="text-sm text-gray-500">{cat.description}</p>}
                <span className="text-xs text-gray-400 uppercase">
                  {cat.appliesTo.replace('_', ' ')}
                </span>
              </div>
              {isAdminOrManager && (
                <div className="flex gap-2">
                  <button onClick={() => openEdit(cat)} className="text-sm text-primary hover:underline">
                    Editar
                  </button>
                  <button onClick={() => handleDelete(cat._id)} className="text-sm text-red-500 hover:underline">
                    Eliminar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <p className="text-gray-500 text-center py-8">No hay categorías</p>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editing ? 'Editar Categoría' : 'Nueva Categoría'}
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
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={(e) => setForm({...form, description: e.target.value})}
                  className="input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Aplica a</label>
                <select
                  value={form.appliesTo}
                  onChange={(e) => setForm({...form, appliesTo: e.target.value})}
                  className="input"
                >
                  <option value="producto">Producto</option>
                  <option value="materia_prima">Materia Prima</option>
                  <option value="ambos">Ambos</option>
                </select>
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn btn-primary flex-1">
                  {mutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={closeModal} className="btn btn-secondary">
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