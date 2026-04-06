import api from './axios';

export const getRawMaterials = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`/raw-materials${query ? `?${query}` : ''}`).then(r => r.data);
};

export const getRawMaterial = (id) => api.get(`/raw-materials/${id}`).then(r => r.data);

export const createRawMaterial = (data) => api.post('/raw-materials', data).then(r => r.data);

export const updateRawMaterial = (id, data) => api.put(`/raw-materials/${id}`, data).then(r => r.data);

export const adjustStock = (id, data) => api.patch(`/raw-materials/${id}/adjust`, data).then(r => r.data);

export const deleteRawMaterial = (id) => api.delete(`/raw-materials/${id}`).then(r => r.data);

export default { getRawMaterials, getRawMaterial, createRawMaterial, updateRawMaterial, adjustStock, deleteRawMaterial };