import { apiClient } from './client.js';

export const getEmployees = async (params = {}) => {
  const response = await apiClient.get('/employees', { params });
  return response.data;
};

export const getAllEmployees = async () => {
  const response = await apiClient.get('/employees/all');
  return response.data;
};

export const getEmployeeById = async (id) => {
  const response = await apiClient.get(`/employees/${id}`);
  return response.data;
};

export const createEmployee = async (data) => {
  const response = await apiClient.post('/employees', data);
  return response.data;
};

export const updateEmployee = async (id, data) => {
  const response = await apiClient.put(`/employees/${id}`, data);
  return response.data;
};

export const deleteEmployee = async (id) => {
  const response = await apiClient.delete(`/employees/${id}`);
  return response.data;
};
