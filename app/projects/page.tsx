import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Projects | DOKKIITECH",
  description: "Selected web projects and product work.",
}

const projects = [
  {
    title: "Portfolio Redesign",
    summary: "A clean and responsive Next.js portfolio focused on clear information architecture.",
    tags: ["Next.js", "TypeScript", "Tailwind CSS"],
    href: "/",
    cta: "Open Site",
  },
  {
    title: "Zenn Product Feed",
    summary: "Product listing powered by external article feeds with filtering and lightweight caching.",
    tags: ["SSR", "Content Integration", "Performance"],
    href: "/products",
    cta: "View Source Page",
  },
  {
    title: "Contact Experience",
    summary: "Simple and accessible contact routes for collaboration, support, and project inquiries.",
    tags: ["UX", "Accessibility", "Responsive UI"],
    href: "/contact",
    cta: "Contact",
  },
]

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-cyan-50/30 to-background px-4 pb-20 pt-20 dark:via-slate-900/20">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">Projects</h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A curated selection of work that demonstrates product thinking, engineering quality, and fast execution.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {projects.map((project) => (
            <Card key={project.title} className="flex h-full flex-col rounded-2xl border shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl">{project.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1 space-y-4">
                <p className="text-muted-foreground">{project.summary}</p>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="rounded-full">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button asChild variant="outline" className="w-full rounded-full">
                  <Link href={project.href}>
                    {project.cta}
                    <ArrowUpRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </main>
  )
}
