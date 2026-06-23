import type { NextConfig } from 'next';
import path from 'path';

const frontendRoot = path.resolve(__dirname);

/** Monorepo : ancrer Turbopack sur frontend/ (évite routes 404 si cwd = racine du dépôt). */
const nextConfig: NextConfig = {
  turbopack: {
    root: frontendRoot,
  },
  outputFileTracingRoot: path.join(frontendRoot, '..'),
};

export default nextConfig;
