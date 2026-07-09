/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Large scene videos upload through /api/admin/upload (up to ~200 MB)
  experimental: {
    proxyClientMaxBodySize: '200mb',
    serverActions: {
      bodySizeLimit: '200mb',
    },
  },
}

export default nextConfig
