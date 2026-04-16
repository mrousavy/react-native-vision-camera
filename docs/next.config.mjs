import { createMDX } from 'fumadocs-mdx/next'

const withMDX = createMDX()

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  images: {
    qualities: [75, 100],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'docs-assets.developer.apple.com',
      },
    ],
  },
  rewrites: async () => [
    {
      source: '/docs.mdx',
      destination: '/llms.mdx/docs',
    },
    {
      source: '/docs/:path*.mdx',
      destination: '/llms.mdx/docs/:path*',
    },
    {
      source: '/api.mdx',
      destination: '/llms.mdx/api',
    },
    {
      source: '/api/:path*.mdx',
      destination: '/llms.mdx/api/:path*',
    },
  ],
}

export default withMDX(config)
