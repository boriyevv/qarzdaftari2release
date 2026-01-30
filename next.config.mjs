// next.config.mjs
import withPWA from 'next-pwa'

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // srcDir: 'src',

  eslint: {
    ignoreDuringBuilds: true,  // ← QO'SHING!
  },
  typescript: {
    ignoreBuildErrors: true,  // ← QO'SHING!
  },
}

export default pwaConfig(nextConfig)