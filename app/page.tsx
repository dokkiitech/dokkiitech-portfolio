import { PortfolioExperience } from "@/components/portfolio-experience"
import { getZennArticles, getZennProductArticles } from "@/lib/zenn"

export default async function HomePage() {
  const username = process.env.NEXT_PUBLIC_ZENN_USERNAME || "dokkiitech"
  const [blogArticles, productArticles] = await Promise.all([
    getZennArticles(username),
    getZennProductArticles(username),
  ])

  return <PortfolioExperience blogArticles={blogArticles} productArticles={productArticles} />
}
