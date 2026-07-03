export const API_URL = '/api';

export const getAuthToken = () => localStorage.getItem('token');
export const setAuthToken = (token: string) => localStorage.setItem('token', token);
export const removeAuthToken = () => localStorage.removeItem('token');

export const fetchApi = async (endpoint: string, options: RequestInit = {}) => {
  const token = getAuthToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!options.body || typeof options.body === 'string') {
     headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong');
  }
  return data;
};
