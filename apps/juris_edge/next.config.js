/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        // Proxy API routes to backend, except routes handled by Next.js
        // Exclude: auth, companies, invitations, portfolios, users, email, services
        source: '/api/:path((?!auth|companies|invitations|portfolios|users|email|services).*)',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
