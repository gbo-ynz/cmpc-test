import axios, { type InternalAxiosRequestConfig } from 'axios';
import { sessionStorage } from '../auth/session-storage';
import { toApiError } from './api-error';

export const SESSION_EXPIRED_EVENT = 'cmpc:session-expired';
const REQUEST_TIMEOUT_MS = 15_000;

export function attachToken(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
  const token = sessionStorage.read()?.token;
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
}

/** Normalizes every failure to ApiError and ends the session on 401. */
export function handleResponseError(error: unknown): Promise<never> {
  const apiError = toApiError(error);
  if (apiError.status === 401) {
    sessionStorage.clear();
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
  }
  return Promise.reject(apiError);
}

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api',
  timeout: REQUEST_TIMEOUT_MS,
});

httpClient.interceptors.request.use(attachToken);
httpClient.interceptors.response.use(undefined, handleResponseError);
