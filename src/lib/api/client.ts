import { ApiError } from '../types';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export class ApiException extends Error {
  status?: number;
  details?: unknown;

  constructor(error: ApiError) {
    super(error.message);
    this.name = 'ApiException';
    this.status = error.status;
    this.details = error.details;
  }
}

/**
 * Friendly error message translator that prevents raw technical dumps
 * (e.g. SQLAlchemy, network crash, raw 500s) from reaching end users.
 */
export function formatErrorMessage(err: unknown): string {
  if (err instanceof ApiException) {
    return err.message;
  }
  if (err instanceof Error) {
    if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('ECONNREFUSED')) {
      return `Unable to connect to the Soli service. Please ensure the backend is running at ${BASE_URL}.`;
    }
    return err.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('soli_token');
}

export function setStoredToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('soli_token', token);
}

export function removeStoredToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('soli_token');
}

export async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE_URL.replace(/\/$/, '')}/${endpoint.replace(/^\//, '')}`;
  const token = getStoredToken();

  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = 'A request error occurred';
      let details: unknown = null;

      try {
        const errorData = await response.json();
        details = errorData;
        if (typeof errorData.detail === 'string') {
          errorMessage = errorData.detail;
        } else if (Array.isArray(errorData.detail)) {
          // Pydantic validation error list
          errorMessage = errorData.detail.map((e: { msg?: string }) => e.msg).filter(Boolean).join(', ') || 'Validation error';
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // Response was not JSON
        if (response.status === 401) {
          errorMessage = 'Invalid email or password. Please try again.';
        } else if (response.status === 403) {
          errorMessage = 'Your account does not have permission to perform this action.';
        } else if (response.status === 404) {
          errorMessage = 'Requested resource not found.';
        } else if (response.status === 409) {
          errorMessage = 'An account with this email address already exists.';
        } else if (response.status >= 500) {
          errorMessage = 'Soli server encountered an issue. Please try again shortly.';
        }
      }

      // Map technical errors to user-friendly messages
      if (errorMessage.toLowerCase().includes('duplicate') || errorMessage.toLowerCase().includes('already exists')) {
        errorMessage = 'An account with this email address is already registered.';
      } else if (errorMessage.toLowerCase().includes('credentials') || errorMessage.toLowerCase().includes('incorrect email or password')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (errorMessage.toLowerCase().includes('sql') || errorMessage.toLowerCase().includes('database')) {
        errorMessage = 'Database is currently unreachable. Please check backend connection.';
      }

      throw new ApiException({
        message: errorMessage,
        status: response.status,
        details,
      });
    }

    if (response.status === 204) {
      return {} as T;
    }

    return await response.json();
  } catch (error) {
    if (error instanceof ApiException) {
      throw error;
    }
    const friendlyMessage = formatErrorMessage(error);
    throw new ApiException({
      message: friendlyMessage,
      status: 0,
      details: error,
    });
  }
}
