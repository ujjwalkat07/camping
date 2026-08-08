import { NextRequest, NextResponse } from 'next/server';
import { getAuthToken, backendFetch } from '@/lib/auth-cookies';

export async function GET(request: NextRequest) {
  try {
    let token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) {
      token = (await getAuthToken('auth')) || (await getAuthToken('admin')) || undefined;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    const response = await backendFetch('/api/user/profile', {
      method: 'GET',
      headers,
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || data.error || 'Failed to fetch user profile' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    //error('GET /api/user/profile error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    let token = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) {
      token = (await getAuthToken('auth')) || (await getAuthToken('admin')) || undefined;
    }

    const body = await request.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    const response = await backendFetch('/api/user/profile', {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });

    const text = await response.text();
    let data: any = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: data.message || data.error || 'Failed to update user profile' },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    //error('PUT /api/user/profile error:', error);
    return NextResponse.json(
      { success: false, message: error?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
