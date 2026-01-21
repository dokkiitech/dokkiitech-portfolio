import { HomePageClient } from "@/components/home-page-client"
import { getZennArticles, getZennProductArticles } from "@/lib/zenn"

export const revalidate = 3600 // 1時間ごとに再検証

export default async function HomePage() {
  // サーバー側でZennデータを取得
  const [blogs, products] = await Promise.all([
    getZennArticles("dokkiitech").catch(() => []),
    getZennProductArticles("dokkiitech", 3).catch(() => [])
  ])

  return <HomePageClient blogs={blogs.slice(0, 3)} products={products} />
}
