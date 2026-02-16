import type { ApiError } from './types';

async function parseJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}

export async function apiGet<T>(input: string): Promise<T> {
  const response = await fetch(input, {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  if (!response.ok) {
    const error = await parseJson<ApiError>(response);
    throw new Error(error.message || `GET failed: ${response.status}`);
  }

  return parseJson<T>(response);
}

export async function apiPost<TRequest, TResponse>(input: string, body: TRequest): Promise<TResponse> {
  const response = await fetch(input, {
    method: 'POST',
    credentials: 'include',
    cache: 'no-store',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await parseJson<ApiError>(response);
    throw new Error(error.message || `POST failed: ${response.status}`);
  }

  return parseJson<TResponse>(response);
}
