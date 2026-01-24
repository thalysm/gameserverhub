/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.igdb.com',
      },
    ],
  },
  output: "standalone",
  experimental: {
    serverActions: {
      bodySizeLimit: '10gb',
    },
  },
}

export default nextConfig
