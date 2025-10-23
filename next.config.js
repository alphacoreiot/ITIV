/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
    ],
    unoptimized: false,
  },
}

module.exports = nextConfig
