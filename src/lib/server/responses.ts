import { NextResponse } from 'next/server';
import type { ApiError } from '@/lib/api/types';

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse<T> {
  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'no-store',
      ...init?.headers,
    },
    ...init,
  });
}

export function jsonError(status: number, errorCode: string, message: string): NextResponse<ApiError> {
  return NextResponse.json(
    {
      errorCode,
      message,
    },
    {
      status,
      headers: {
        'Cache-Control': 'no-store',
      },
    }
  );
}

export async function readJsonBody<T>(request: Request): Promise<T> {
  const raw = await request.text();
  if (!raw) {
    throw new Error('Missing JSON body');
  }
  return JSON.parse(raw) as T;
}
