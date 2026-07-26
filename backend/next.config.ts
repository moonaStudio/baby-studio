import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Monorepo root so tracing can include ../assets/themes as well as backend/assets/themes.
  // Paths in outputFileTracingIncludes must be relative to this root — absolute paths
  // get re-joined on Vercel and produce /backend/vercel/path0/backend/... ENOENT.
  outputFileTracingRoot: path.join(__dirname, ".."),
  outputFileTracingIncludes: {
    "/api/process": [
      "backend/assets/themes/**/*",
      "assets/themes/**/*"
    ]
  }
};

export default nextConfig;
