import axios from 'axios';
import {
  DashboardStats,
  InvestigationSummary,
  InvestigationDetail,
  DatasetMeta,
  Signal,
  Case,
  GraphData,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to add JWT token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('fintrace_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authApi = {
  login: async (username: string, password: string) => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return res.data;
  },
};

export const investigationApi = {
  getDashboard: async (): Promise<DashboardStats> => {
    const res = await api.get('/investigations/dashboard');
    return res.data;
  },
  list: async (): Promise<InvestigationSummary[]> => {
    const res = await api.get('/investigations');
    return res.data;
  },
  create: async (name: string, description?: string): Promise<InvestigationSummary> => {
    const res = await api.post('/investigations', { name, description });
    return res.data;
  },
  getDetail: async (id: string): Promise<InvestigationDetail> => {
    const res = await api.get(`/investigations/${id}`);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await api.delete(`/investigations/${id}`);
  },
  uploadDataset: async (id: string, file: File): Promise<DatasetMeta> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post(`/investigations/${id}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
};

export const caseApi = {
  list: async (investigationId: string): Promise<Case[]> => {
    const res = await api.get(`/investigations/${investigationId}/cases`);
    return res.data;
  },
  getDetail: async (investigationId: string, caseId: string): Promise<Case> => {
    const res = await api.get(`/investigations/${investigationId}/cases/${caseId}`);
    return res.data;
  },
  updateStatus: async (investigationId: string, caseId: string, status: string): Promise<Case> => {
    const res = await api.patch(`/investigations/${investigationId}/cases/${caseId}/status`, { status });
    return res.data;
  },
  getReport: async (investigationId: string, caseId: string): Promise<any> => {
    const res = await api.get(`/investigations/${investigationId}/cases/${caseId}/report`);
    return res.data;
  },
};

export const signalApi = {
  list: async (investigationId: string): Promise<Signal[]> => {
    const res = await api.get(`/investigations/${investigationId}/signals`);
    return res.data;
  },
};

export const graphApi = {
  getGraph: async (investigationId: string): Promise<GraphData> => {
    const res = await api.get(`/investigations/${investigationId}/graph`);
    return res.data;
  },
};

export const demoApi = {
  loadDemo: async (): Promise<InvestigationSummary> => {
    const res = await api.post('/demo/load');
    return res.data;
  },
};

export default api;
