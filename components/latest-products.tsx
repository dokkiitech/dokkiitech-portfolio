import { BlogCard } from "@/components/blog-card"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { getZennProductArticles } from "@/lib/zenn"

export async function LatestProducts() {
  const products = await getZennProductArticles("dokkiitech", 3)

  if (products.length === 0) {
    return null
  }

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Latest Products
          </h2>
          <p className="text-xl text-muted-foreground">最新のプロダクト</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {products.map((product) => (
            <BlogCard key={product.link} article={product} />
          ))}
        </div>

        <div className="text-center">
          <Button
            size="lg"
            variant="outline"
            className="rounded-full px-8 py-6 text-lg border-2 hover:bg-muted/50 transition-all duration-300"
            asChild
          >
            <Link href="/products">
              すべてのプロダクトを見る
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  )
}
