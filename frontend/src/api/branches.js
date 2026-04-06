import api from './axios';

export const getBranches = () => api.get('/branches').then(res => res.data);
export const getBranch = (id) => api.get(`/branches/${id}`).then(res => res.data);
export const createBranch = (data) => api.post('/branches', data).then(res => res.data);
export const updateBranch = (id, data) => api.put(`/branches/${id}`, data).then(res => res.data);

export default { getBranches, getBranch, createBranch, updateBranch };