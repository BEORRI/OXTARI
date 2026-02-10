/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  webpack: (config) => {
    config.module.rules.push({
      test: /\.glsl$/,
      use: ['raw-loader'],
    });
    return config;
  },
  async redirects() {
    return [
      {
        source: '/v1',
        destination: '/',
        permanent: true,
      },
      {
        source: '/v1/:path*',
        destination: '/:path*',
        permanent: true,
      },
    ];
  },
};

// Set assetPrefix only in production/export mode
if (process.env.NODE_ENV === 'production') {
  nextConfig.assetPrefix = '/static';
}

module.exports = nextConfig;