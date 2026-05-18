const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: BodyInit | null;
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const url = new URL(`${API_BASE_URL}${endpoint}`);
  
  if (options.params) {
    Object.entries(options.params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  
  const isFormData = options.body instanceof FormData;
  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const body = isFormData ? options.body : JSON.stringify(options.body);

  const response = await fetch(url.toString(), {
    ...options,
    headers,
    body,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      data?.message || response.statusText || 'Request failed',
      response.status,
      data
    );
  }

  return data as T;
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => 
    request<T>(endpoint, { ...options, method: 'GET' }),
  
  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { 
      ...options, 
      method: 'POST', 
      body: body as BodyInit | null
    }),
  
  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { 
      ...options, 
      method: 'PUT', 
      body: body as BodyInit | null
    }),
  
  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { 
      ...options, 
      method: 'PATCH', 
      body: body as BodyInit | null
    }),
  
  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'DELETE' }),
};
