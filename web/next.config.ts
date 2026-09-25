import path from 'node:path'
import type {NextConfig} from 'next'

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  // The repo has a lockfile at its root and one here; pin Turbopack to this app.
  turbopack: {root: path.resolve(process.cwd())},
  experimental: {
    // Photos are compressed in the browser, so a report is well under this. Hosting caps bodies at ~4.5 MB regardless.
    serverActions: {bodySizeLimit: '6mb'},
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {key: 'X-Content-Type-Options', value: 'nosniff'},
          {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'},
          {key: 'X-Frame-Options', value: 'SAMEORIGIN'},
          {key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)'},
        ],
      },
    ]
  },
}

export default nextConfig
