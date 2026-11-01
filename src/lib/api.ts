import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useAuth } from '../store/auth';

const CORE = import.meta.env.VITE_CORE_API_URL ?? 'http://localhost:8080';
const INGEST = import.meta.env.VITE_INGEST_API_URL ?? 'http://localhost:8081';
const MATCH = import.meta.env.VITE_MATCH_API_URL ?? 'http://localhost:8082';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// one refresh at a time: parallel 401s wait for the same promise (the refresh token is single-use)
let refreshing: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const { refreshToken, setTokens, clear } = useAuth.getState();
  if (!refreshToken) throw new Error('no refresh token');
  try {
    const { data } = await axios.post<AuthResponse>(`${CORE}/auth/refresh`, { refreshToken });
    setTokens(data.accessToken, data.refreshToken);
    return data.accessToken;
  } catch (e) {
    clear();
    throw e;
  }
}

function withAuth(instance: AxiosInstance): AxiosInstance {
  instance.interceptors.request.use((config) => {
    const token = useAuth.getState().accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  instance.interceptors.response.use(undefined, async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retried?: boolean }) | undefined;
    if (error.response?.status !== 401 || !original || original._retried || !useAuth.getState().refreshToken) {
      throw error;
    }
    original._retried = true;
    refreshing ??= refreshAccessToken().finally(() => {
      refreshing = null;
    });
    const token = await refreshing;
    original.headers.Authorization = `Bearer ${token}`;
    return instance(original);
  });
  return instance;
}

export const coreApi = withAuth(axios.create({ baseURL: CORE }));
export const ingestApi = withAuth(axios.create({ baseURL: INGEST }));
export const matchApi = withAuth(axios.create({ baseURL: MATCH }));

/** Unauthenticated calls (login/register). */
export const publicApi = axios.create({ baseURL: CORE });

export function errorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data as { detail?: string; title?: string } | undefined;
    return d?.detail ?? d?.title ?? e.message;
  }
  return e instanceof Error ? e.message : 'Something went wrong';
}
