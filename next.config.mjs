/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      // 旧 /about は削除済み。既存のサジェスト・被リンクを /profile へ誘導
      {
        source: "/about",
        destination: "/profile",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
