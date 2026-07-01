import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // Monorepo: backend/ + ../assets/themes — required for Vercel file tracing
  outputFileTracingRoot: path.join(__dirname, ".."),
  outputFileTracingIncludes: {
    "/api/process": [
      path.join(__dirname, "assets/themes/**/*"),
      path.join(__dirname, "../assets/themes/**/*")
    ]
  }
};

export default nextConfig;
