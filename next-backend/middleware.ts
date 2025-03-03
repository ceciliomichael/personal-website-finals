import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  // Get the origin from the request headers
  const origin = request.headers.get('origin') || '';
  
  // Define allowed origins
  const allowedOrigins = process.env.NODE_ENV === 'production' 
    ? ['https://personal-website6.vercel.app', 'https://www.ultrawavelet.me', 'https://ultrawavelet.me', 'https://webprog-cecilio.vercel.app']
    : ['*'];
  
  // Check if the origin is allowed
  const isAllowedOrigin = allowedOrigins.includes('*') || allowedOrigins.includes(origin);
  
  // Set the CORS headers
  const headers = new Headers(request.headers);
  
  // Set the appropriate origin
  if (isAllowedOrigin) {
    headers.set('Access-Control-Allow-Origin', origin);
  } else if (process.env.NODE_ENV === 'production') {
    headers.set('Access-Control-Allow-Origin', 'https://webprog-cecilio.vercel.app');
  } else {
    headers.set('Access-Control-Allow-Origin', '*');
  }
  
  // Set other CORS headers
  headers.set('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  headers.set('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return NextResponse.json({}, { status: 204, headers });
  }
  
  // Continue with the request
  const response = NextResponse.next();
  
  // Apply the headers to the response
  Object.entries(Object.fromEntries(headers.entries())).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  return response;
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: '/api/:path*',
}; 