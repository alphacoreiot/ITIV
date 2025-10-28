/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Habilita modo standalone para Docker
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sefaz.camacari.ba.gov.br',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.camacari.ba.gov.br',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ba.gov.br',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**.ba.gov.br',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'agenciabrasil.ebc.com.br',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'agenciabrasil.ebc.com.br',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'imagens.ebc.com.br',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'imagens.ebc.com.br',
        port: '',
        pathname: '/**',
      },
    ],
    unoptimized: false,
  },
}

module.exports = nextConfig
