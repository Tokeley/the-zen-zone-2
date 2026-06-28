/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Large scene videos upload through /api/admin/upload (up to ~500 MB)
  experimental: {
    proxyClientMaxBodySize: '500mb',
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
}

export default nextConfig
