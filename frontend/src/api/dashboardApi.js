import { apiClient } from './client.js';

export const getDashboardMetrics = async () => {
  const response = await apiClient.get('/dashboard');
  return response.data;
};
