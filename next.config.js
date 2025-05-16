/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental:{
    serverActions: {},
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  }
}

module.exports = nextConfig
