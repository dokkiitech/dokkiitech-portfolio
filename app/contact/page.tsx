import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Github, Mail, MessageCircle, Instagram } from "lucide-react"
import { RiTwitterXFill } from 'react-icons/ri'


export default function ContactPage() {
  const socialLinks = [
    {
      name: "GitHub",
      icon: Github,
      url: "https://github.com/dokkiitech",
      color: "hover:text-gray-900 dark:hover:text-gray-100",
    },
    {
      name: "X",
      icon: RiTwitterXFill,
      url: "https://x.com/dokkiitech",
      color: "hover:text-blue-500",
    },
    {
      name: "Instagram",
      icon: Instagram,
      url: "https://instagram.com/dokkiitech",
      color: "hover:text-blue-600",
    },
    {
      name: "Mail",
      icon: Mail,
      url: "mailto:info@dokkiitech.com",
      color: "hover:text-indigo-500",
    },
  ]

  return (
    <main className="min-h-screen bg-gradient-to-b from-background via-sky-50/30 to-background px-4 pb-20 pt-20 dark:via-slate-900/20">
      <div className="container mx-auto max-w-4xl">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-sky-600 to-cyan-600 bg-clip-text text-transparent">
          Contact
        </h1>
        <p className="text-xl text-muted-foreground">Open for project collaboration and technical consulting.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {/* SNSリンク */}
        <Card className="rounded-3xl border-2 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold">Social</h2>
            </div>
            <div className="space-y-4">
              {socialLinks.map((link) => (
                <Button
                  key={link.name}
                  variant="ghost"
                  size="lg"
                  className={`w-full justify-start rounded-2xl h-14 ${link.color} transition-colors`}
                  asChild
                >
                  <a href={link.url} target="_blank" rel="noopener noreferrer">
                    <link.icon className="w-6 h-6 mr-4" />
                    <span className="text-lg">{link.name}</span>
                    <span className="ml-auto text-sm text-muted-foreground">@dokkiitech</span>
                  </a>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* メッセージ */}
        <Card className="rounded-3xl border-2 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-8">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-500 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-2xl font-bold">メッセージ</h2>
            </div>
            <div className="space-y-6">
              <p className="text-muted-foreground leading-relaxed">
                Reach out for product development, front-end engineering, technical consultation, or partnership ideas.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                For urgent requests, a direct message on social channels is usually the fastest route.
              </p>
              <div className="p-4 bg-muted/50 rounded-2xl">
                <p className="text-sm text-muted-foreground">
                  Typical response time is within 24 hours. Include project scope, timeline, and goals for faster alignment.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </main>
  )
}
