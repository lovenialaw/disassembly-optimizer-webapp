import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getProducts = async () => {
  const response = await api.get('/products');
  return response.data;
};

export const getProductMetadata = async (productId) => {
  const response = await api.get(`/products/${productId}/metadata`);
  return response.data;
};

export const getProductGraph = async (productId) => {
  const response = await api.get(`/products/${productId}/graph`);
  return response.data;
};

export const optimizeDisassembly = async (productId, data) => {
  const response = await api.post(`/products/${productId}/optimize`, data);
  return response.data;
};

export const getProductParts = async (productId) => {
  const response = await api.get(`/products/${productId}/parts`);
  return response.data;
};

export const getValidPaths = async (productId, targetPart) => {
  // Get valid paths for a target part - returns edges in those paths
  const response = await api.post(`/products/${productId}/valid-paths`, { target_part: targetPart });
  return response.data;
};

export default api;

