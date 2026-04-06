import api from './axios';

export const getCategories = (appliesTo) => 
  api.get(`/categories${appliesTo ? `?appliesTo=${appliesTo}` : ''}`).then(r => r.data);

export const getCategory = (id) => 
  api.get(`/categories/${id}`).then(r => r.data);

export const createCategory = (data) => 
  api.post('/categories', data).then(r => r.data);

export const updateCategory = (id, data) => 
  api.put(`/categories/${id}`, data).then(r => r.data);

export const deleteCategory = (id) => 
  api.delete(`/categories/${id}`).then(r => r.data);

export default { getCategories, getCategory, createCategory, updateCategory, deleteCategory };