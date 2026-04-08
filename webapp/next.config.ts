import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: ['aisp-converter', 'aisp-validator', 'better-sqlite3'],
};

export default nextConfig;
