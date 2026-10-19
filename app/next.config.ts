import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
    deviceSizes: [640, 828, 1080, 1920, 2560],
    imageSizes: [64, 96, 128, 256, 384],
    qualities: [75, 80, 85, 90, 95],
  },
};

export default withNextIntl(nextConfig);
