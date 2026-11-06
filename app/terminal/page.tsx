import { PortfolioExperience } from "@/components/portfolio-experience"
import { getZennArticles, getZennProductArticles } from "@/lib/zenn"
import { getFocusStackFromGitHub, type FocusStackItem } from "@/lib/github"

export const metadata = {
  title: "Terminal Mode",
  description: "旧デザインのターミナルUIです。コマンドでプロフィール・ブログ・予約を操作できます。",
  robots: { index: false },
}

export default async function TerminalPage() {
  const username = process.env.NEXT_PUBLIC_ZENN_USERNAME || "dokkiitech"
  const githubUsername = process.env.NEXT_PUBLIC_GITHUB_USERNAME || "dokkiitech"
  const [blogArticles, productArticles] = await Promise.all([
    getZennArticles(username),
    getZennProductArticles(username),
  ])
  let focusStack: FocusStackItem[] = []
  try {
    focusStack = await getFocusStackFromGitHub(githubUsername)
  } catch {
    focusStack = []
  }

  return <PortfolioExperience blogArticles={blogArticles} productArticles={productArticles} focusStack={focusStack} />
}
