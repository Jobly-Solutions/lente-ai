/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['app.braviloai.com'],
  },
  env: {
    BRAVILO_API_KEY: process.env.BRAVILO_API_KEY,
    BRAVILO_BASE_URL: process.env.BRAVILO_BASE_URL,
  },
  experimental: {
    // fetchCache removed in Next.js 15
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate, proxy-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ]
  },
}

module.exports = nextConfig
