import axios from "axios";
import { getClientRequestHeaders } from "@/client/interceptor/helper";

const REMOTE_API_URL = "https://hrms-backend-9q2z.onrender.com/api";

export const API_URL = process.env.NEXT_PUBLIC_API_URL || REMOTE_API_URL;

export const api = axios.create({ baseURL: API_URL });

const TOKEN_KEY = "hrms_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (typeof window === "undefined") return;
  if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
  else window.sessionStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  config.headers = config.headers || {};
  Object.assign(config.headers, getClientRequestHeaders());
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      setToken(null);
    }
    return Promise.reject(error);
  }
);
