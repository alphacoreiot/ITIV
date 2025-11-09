export { default } from 'next-auth/middleware'

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/bi-refis/:path*',
    '/bi-iptu/:path*',
    '/bi-tff/:path*',
    '/bi-refis-percentuais/:path*',
    '/noticia/:path*',
  ],
}
