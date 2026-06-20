import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/process": [path.join(__dirname, "../assets/themes/**/*")]
  }
};

export default nextConfig;
