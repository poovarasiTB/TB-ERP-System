/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,

    // Environment variables exposed to the browser
    env: {
        NEXT_PUBLIC_APP_NAME: 'TB ERP System',
        NEXT_PUBLIC_VERSION: '1.0.0',
    },

    // Experimental features
    // serverActions is now enabled by default in Next.js 14+

    // Rewrites for API proxying (optional - we use API routes instead)
    // async rewrites() {
    //   return [
    //     {
    //       source: '/api/v1/assets/:path*',
    //       destination: `${process.env.ASSET_SERVICE_URL}/api/v1/:path*`,
    //     },
    //   ];
    // },

    // Security headers
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-Frame-Options',
                        value: 'DENY',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
