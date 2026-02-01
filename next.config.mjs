/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  // For GitHub Pages deployment at username.github.io
  // basePath and assetPrefix are empty since this is the root repo
  basePath: '',
  assetPrefix: '',
  trailingSlash: true,
};

export default nextConfig;
