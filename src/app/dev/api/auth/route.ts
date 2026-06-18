import { NextResponse } from 'next/server';

const DEV_AUTH_LOGIN = process.env.DEV_AUTH_LOGIN || 'rafal';
const DEV_AUTH_PASSWORD = process.env.DEV_AUTH_PASSWORD || 'wilczki';

export async function POST(request: Request) {
  const body = await request.json();
  const login = body?.login;
  const password = body?.password;

  if (login !== DEV_AUTH_LOGIN || password !== DEV_AUTH_PASSWORD) {
    return NextResponse.json({ success: false, message: 'Invalid login or password' }, { status: 401 });
  }

  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: 'dev-auth',
    value: '1',
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 2,
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set({
    name: 'dev-auth',
    value: '',
    path: '/',
    maxAge: 0,
  });
  return response;
}
