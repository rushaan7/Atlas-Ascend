import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const proto = request.headers.get('x-forwarded-proto');
    if (proto && proto !== 'https') {
      const secureUrl = new URL(request.url);
      secureUrl.protocol = 'https:';
      return NextResponse.redirect(secureUrl, 308);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|favicon.ico|icon.svg|manifest.webmanifest|sw.js).*)']
};

