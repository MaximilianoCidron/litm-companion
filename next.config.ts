import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // @react-pdf/renderer pulls in Node-only paths (fs, fonts) that Next must
  // leave external in the server bundle instead of trying to inline.
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
