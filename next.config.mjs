/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  env: {
    NEXT_PUBLIC_APPLE_OIDC_ENABLED: process.env.APPLE_CLIENT_ID ? '1' : '',
  },
  async headers() {
    return [
      {
        source: '/((?!api/auth).*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
