import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { getBranches, createBranch, updateBranch } from '../api/branches'

export default function Branches() {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const queryClient = useQueryClient()
  
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', address: '', phone: '' })

  // Query con React Query
  const { data: branches = [], isLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: () => getBranches().then(res => res.data),
  })

  // Mutation
  const mutation = useMutation({
    mutationFn: (data) => editing 
      ? updateBranch(editing, data)
      : createBranch(data),
    onSuccess: () => {
      queryClient.invalidateQueries(['branches'])
      setShowModal(false)
      setEditing(null)
      setForm({ name: '', address: '', phone: '' })
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    mutation.mutate(form)
  }

  const openEdit = (branch) => {
    setEditing(branch._id)
    setForm({ name: branch.name, address: branch.address, phone: branch.phone || '' })
    setShowModal(true)
  }

  const openNew = () => {
    setEditing(null)
    setForm({ name: '', address: '', phone: '' })
    setShowModal(true)
  }

  if (isLoading) return <div className="p-4">Cargando...</div>

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Sucursales</h1>
        {isAdmin && (
          <button onClick={openNew} className="btn btn-primary">
            + Nueva Sucursal
          </button>
        )}
      </div>

      <div className="space-y-4">
        {branches.map((branch) => (
          <div key={branch._id} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold text-lg">{branch.name}</h3>
                <p className="text-sm text-gray-500">{branch.address}</p>
                {branch.phone && <p className="text-sm text-gray-400">{branch.phone}</p>}
              </div>
              {isAdmin && (
                <button onClick={() => openEdit(branch)} className="text-sm text-primary hover:underline">
                  Editar
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {branches.length === 0 && (
        <p className="text-gray-500 text-center py-8">No hay sucursales</p>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editing ? 'Editar Sucursal' : 'Nueva Sucursal'}
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
                <label className="block text-sm font-medium mb-1">Dirección</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({...form, address: e.target.value})}
                  className="input"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Teléfono</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({...form, phone: e.target.value})}
                  className="input"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button type="submit" className="btn btn-primary flex-1">
                  {mutation.isPending ? 'Guardando...' : 'Guardar'}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}