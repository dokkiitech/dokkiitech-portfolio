import Link from "next/link"
import { ArrowRight, Mail, Rocket, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function HomePage() {
  const highlights = [
    {
      icon: Rocket,
      title: "Ship Quickly",
      description: "Rapidly prototype and launch web products with a practical engineering approach.",
    },
    {
      icon: Layers,
      title: "Build Solid Foundations",
      description: "Maintainable architecture, reusable components, and scalable front-end patterns.",
    },
    {
      icon: Mail,
      title: "Collaborate Clearly",
      description: "Fast communication and transparent progress from kickoff to delivery.",
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-sky-50/30 to-background dark:via-slate-900/30">
      <section className="container mx-auto max-w-5xl px-4 pb-20 pt-20 md:pt-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 inline-flex rounded-full border border-sky-300/40 bg-sky-100/60 px-4 py-1 text-sm font-medium text-sky-800 dark:border-sky-700/40 dark:bg-sky-900/30 dark:text-sky-200">
            Portfolio
          </p>
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            Building clean digital products with speed and focus.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            I design and build web experiences that are easy to use, easy to maintain, and ready to scale.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="rounded-full">
              <Link href="/projects">
                View Projects
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-full">
              <Link href="/contact">Contact Me</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-6xl px-4 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <Card key={item.title} className="rounded-2xl border shadow-sm">
              <CardHeader>
                <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
                  <item.icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-xl">{item.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </main>
  )
}
