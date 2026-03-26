import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Защита админ панели - можно добавить дополнительную логику
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // В реальном приложении здесь будет проверка токена/сессии
    // Пока просто пропускаем все запросы
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
