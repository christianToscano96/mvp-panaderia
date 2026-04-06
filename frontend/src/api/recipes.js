import api from './axios';

export const getRecipes = (params = {}) => {
  const query = new URLSearchParams(params).toString();
  return api.get(`/recipes${query ? `?${query}` : ''}`).then(r => r.data);
};

export const getRecipe = (productId) => api.get(`/recipes/${productId}`).then(r => r.data);

export const createRecipe = (data) => api.post('/recipes', data).then(r => r.data);

export const updateRecipe = (id, data) => api.put(`/recipes/${id}`, data).then(r => r.data);

export const deleteRecipe = (id) => api.delete(`/recipes/${id}`).then(r => r.data);

export default { getRecipes, getRecipe, createRecipe, updateRecipe, deleteRecipe };