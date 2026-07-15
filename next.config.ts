import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Server Actions default to a 1MB body limit - too small for real file
      // uploads (materials/assignments/announcements/submissions all accept
      // attachments up to MAX_FILE_SIZE_BYTES, see src/lib/storage/validation.ts).
      bodySizeLimit: "30mb",
    },
  },
};

export default nextConfig;
