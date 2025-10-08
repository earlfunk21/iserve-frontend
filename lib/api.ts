import axios from 'axios';
import { authClient } from './auth-client';

const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_SERVER_URL,
});

api.interceptors.request.use((config) => {
  const cookies = authClient.getCookie();
  config.headers['Cookie'] = cookies;
  config.withCredentials = false;
  return config;
});

export default api;
