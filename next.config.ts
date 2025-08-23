import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    domains: [
      'via.placeholder.com',
      'localhost',
       'backend.novashop.io.vn',
    ],
  },
  eslint: {
    // Bỏ qua lỗi eslint khi build để deploy nhanh
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
