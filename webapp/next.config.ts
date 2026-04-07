import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['aisp-converter', 'aisp-validator'],
};

export default nextConfig;
