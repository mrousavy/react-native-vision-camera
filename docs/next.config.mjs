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
  // Redirects from legacy Docusaurus URLs (react-native-vision-camera.com) to
  // the current fumadocs-based structure. Keep these so pages indexed by Google
  // under the old domain don't 404 after the domain redirect preserves the path.
  redirects: async () => [
    { source: '/docs/guides', destination: '/docs', permanent: true },
    {
      source: '/docs/guides/getting-started',
      destination: '/docs',
      permanent: true,
    },
    {
      source: '/docs/guides/devices',
      destination: '/docs/devices',
      permanent: true,
    },
    {
      source: '/docs/guides/lifecycle',
      destination: '/docs/lifecycle',
      permanent: true,
    },
    {
      source: '/docs/guides/formats',
      destination: '/docs/constraints',
      permanent: true,
    },
    {
      source: '/docs/guides/preview',
      destination: '/docs/preview-output',
      permanent: true,
    },
    {
      source: '/docs/guides/taking-photos',
      destination: '/docs/photo-output',
      permanent: true,
    },
    {
      source: '/docs/guides/recording-videos',
      destination: '/docs/video-output',
      permanent: true,
    },
    {
      source: '/docs/guides/code-scanning',
      destination: '/docs/barcode-scanner',
      permanent: true,
    },
    {
      source: '/docs/guides/frame-processors',
      destination: '/docs/frame-output',
      permanent: true,
    },
    {
      source: '/docs/guides/frame-processors-interacting',
      destination: '/docs/frame-output',
      permanent: true,
    },
    {
      source: '/docs/guides/frame-processor-plugins-community',
      destination: '/docs/native-frame-processor-plugins',
      permanent: true,
    },
    {
      source: '/docs/guides/pixel-formats',
      destination: '/docs/pixel-formats-map',
      permanent: true,
    },
    {
      source: '/docs/guides/frame-processors-tips',
      destination: '/docs/async-frame-processing',
      permanent: true,
    },
    {
      source: '/docs/guides/skia-frame-processors',
      destination: '/docs/skia-frame-processors',
      permanent: true,
    },
    {
      source: '/docs/guides/frame-processors-plugins-overview',
      destination: '/docs/native-frame-processor-plugins',
      permanent: true,
    },
    {
      source: '/docs/guides/frame-processors-plugins-ios',
      destination: '/docs/native-frame-processor-plugins',
      permanent: true,
    },
    {
      source: '/docs/guides/frame-processors-plugins-android',
      destination: '/docs/native-frame-processor-plugins',
      permanent: true,
    },
    {
      source: '/docs/guides/frame-processors-plugins-expo',
      destination: '/docs/native-frame-processor-plugins',
      permanent: true,
    },
    {
      source: '/docs/guides/frame-processors-plugins-cpp',
      destination: '/docs/native-frame-processor-plugins',
      permanent: true,
    },
    {
      source: '/docs/guides/frame-processors-plugins-final',
      destination: '/docs/native-frame-processor-plugins',
      permanent: true,
    },
    {
      source: '/docs/guides/zooming',
      destination: '/docs/zooming',
      permanent: true,
    },
    {
      source: '/docs/guides/focusing',
      destination: '/docs/tap-to-focus',
      permanent: true,
    },
    {
      source: '/docs/guides/orientation',
      destination: '/docs/orientation',
      permanent: true,
    },
    {
      source: '/docs/guides/exposure',
      destination: '/docs/exposure-bias',
      permanent: true,
    },
    {
      source: '/docs/guides/hdr',
      destination: '/docs/photo-hdr',
      permanent: true,
    },
    {
      source: '/docs/guides/stabilization',
      destination: '/docs/video-stabilization',
      permanent: true,
    },
    {
      source: '/docs/guides/location',
      destination: '/docs/location',
      permanent: true,
    },
    {
      source: '/docs/guides/performance',
      destination: '/docs/performance',
      permanent: true,
    },
    { source: '/docs/guides/errors', destination: '/docs', permanent: true },
    { source: '/docs/guides/mocking', destination: '/docs', permanent: true },
    {
      source: '/docs/guides/troubleshooting',
      destination: '/docs',
      permanent: true,
    },
    {
      source: '/docs/guides/vision-camera-v5',
      destination: '/docs',
      permanent: true,
    },
    {
      source: '/docs/guides/shadowlens',
      destination: '/docs',
      permanent: true,
    },
    { source: '/docs/guides/:path*', destination: '/docs', permanent: true },
    { source: '/docs/api', destination: '/api', permanent: true },
    { source: '/docs/api/:path*', destination: '/api', permanent: true },
  ],
}

export default withMDX(config)
