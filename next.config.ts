import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Vercel image-optimization quota returns 402 for uncached images
    // (OPTIMIZED_IMAGE_REQUEST_PAYMENT_REQUIRED), which broke every newly
    // added product photo. Printify mockups are small (~85KB) and served
    // from Printify's own CDN, so the store loads them unoptimized.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.printify.com",
      },
      {
        protocol: "https",
        hostname: "images-api.printify.com",
      },
      {
        protocol: "https",
        hostname: "8ldzqw5nhl4tvlis.public.blob.vercel-storage.com",
      },
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
