import api from './axios';

export const getProducts = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`/products${query ? `?${query}` : ''}`).then(r => r.data);
};

export const getProduct = (id) => api.get(`/products/${id}`).then(r => r.data);

export const createProduct = (data) => api.post('/products', data).then(r => r.data);

export const updateProduct = (id, data) => api.put(`/products/${id}`, data).then(r => r.data);

export const adjustStock = (id, data) => api.patch(`/products/${id}/adjust`, data).then(r => r.data);

export const deleteProduct = (id) => api.delete(`/products/${id}`).then(r => r.data);

export default { getProducts, getProduct, createProduct, updateProduct, adjustStock, deleteProduct };