import { apiClient } from './client.js';

export const getTasks = async (params = {}) => {
  const response = await apiClient.get('/tasks', { params });
  return response.data;
};

export const getTaskById = async (id) => {
  const response = await apiClient.get(`/tasks/${id}`);
  return response.data;
};

export const createTask = async (data) => {
  const response = await apiClient.post('/tasks', data);
  return response.data;
};

export const updateTask = async (id, data) => {
  const response = await apiClient.put(`/tasks/${id}`, data);
  return response.data;
};

export const updateTaskStatus = async (id, status) => {
  const response = await apiClient.put(`/tasks/${id}/status`, { status });
  return response.data;
};

export const deleteTask = async (id) => {
  const response = await apiClient.delete(`/tasks/${id}`);
  return response.data;
};

export const exportTasksCSV = async (params = {}) => {
  const response = await apiClient.get('/tasks/export', {
    params,
    responseType: 'blob',
  });
  return response.data;
};
