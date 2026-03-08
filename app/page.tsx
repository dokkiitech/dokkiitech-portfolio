import { PortfolioExperience } from "@/components/portfolio-experience"
import { getZennArticles, getZennProductArticles } from "@/lib/zenn"
import { getFocusStackFromGitHub } from "@/lib/github"

export default async function HomePage() {
  const username = process.env.NEXT_PUBLIC_ZENN_USERNAME || "dokkiitech"
  const githubUsername = process.env.NEXT_PUBLIC_GITHUB_USERNAME || "dokkiitech"
  const [blogArticles, productArticles] = await Promise.all([
    getZennArticles(username),
    getZennProductArticles(username),
  ])
  let focusStack = []
  try {
    focusStack = await getFocusStackFromGitHub(githubUsername)
  } catch {
    focusStack = []
  }

  return <PortfolioExperience blogArticles={blogArticles} productArticles={productArticles} focusStack={focusStack} />
}
