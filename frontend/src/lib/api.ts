import axios from 'axios';
import type { DebugSession } from '../types';

const API_BASE_URL = 'http://localhost:8000';

export const api = {
  // Start a debug session
  startDebugSession: async (code: string, maxIterations: number = 10): Promise<DebugSession> => {
    const response = await axios.post(`${API_BASE_URL}/api/debug`, {
      code,
      max_iterations: maxIterations,
    });
    return response.data;
  },

  // Get session status
  getSession: async (sessionId: string): Promise<DebugSession> => {
    const response = await axios.get(`${API_BASE_URL}/api/session/${sessionId}`);
    return response.data;
  },

  // List all sessions
  listSessions: async (): Promise<DebugSession[]> => {
    const response = await axios.get(`${API_BASE_URL}/api/sessions`);
    return response.data;
  },

  // Health check
  healthCheck: async (): Promise<{ status: string }> => {
    const response = await axios.get(`${API_BASE_URL}/health`);
    return response.data;
  },

  // Execute code
  executeCode: async (code: string, language: string = 'python') => {
    const response = await axios.post(`${API_BASE_URL}/api/execute`, {
      code,
      language,
    });
    return response.data;
  },
};
