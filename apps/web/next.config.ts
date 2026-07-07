import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Monorepo: trace files from the workspace root so build output includes
  // shared workspace packages (e.g. packages/shared) correctly.
  outputFileTracingRoot: path.join(import.meta.dirname, "../../"),
};

export default nextConfig;
