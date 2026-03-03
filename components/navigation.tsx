"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"
import { Menu, X } from "lucide-react"

type NavItem = {
  name: string
  href: string
  hash?: string
}

const navigation: NavItem[] = [
  { name: "Home", href: "/#home", hash: "#home" },
  { name: "About", href: "/#about", hash: "#about" },
  { name: "Products", href: "/products" },
  { name: "Blog", href: "/blog" },
  { name: "Contact", href: "/#contact", hash: "#contact" },
  { name: "Appoint", href: "/#appoint", hash: "#appoint" },
]

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentHash, setCurrentHash] = useState("#home")
  const pathname = usePathname()

  useEffect(() => {
    const updateHash = () => {
      setCurrentHash(window.location.hash || "#home")
    }

    updateHash()
    window.addEventListener("hashchange", updateHash)

    return () => window.removeEventListener("hashchange", updateHash)
  }, [])

  const isActive = (item: NavItem) => {
    if (item.hash) {
      return pathname === "/" && currentHash === item.hash
    }

    return pathname === item.href
  }

  return (
    <>
      <nav className="fixed top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/#home" className="flex items-center space-x-2">
              <span className="bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-2xl font-bold text-transparent">{"<>"}</span>
              <span className="text-lg font-bold">dokkiitech.com</span>
            </Link>

            <div className="hidden items-center space-x-1 md:flex">
              {navigation.map((item) => (
                <Button key={item.name} variant={isActive(item) ? "default" : "ghost"} className="rounded-full" asChild>
                  <Link href={item.href}>{item.name}</Link>
                </Button>
              ))}
            </div>

            <div className="flex items-center space-x-2">
              <ThemeToggle />

              <Button
                variant="ghost"
                size="icon"
                className="rounded-full bg-gradient-to-r from-blue-500/10 to-purple-500/10 transition-all duration-300 hover:scale-105 hover:from-blue-500/20 hover:to-purple-500/20 md:hidden"
                onClick={() => setIsOpen(!isOpen)}
              >
                <div className="relative h-5 w-5">
                  <Menu className={`absolute h-5 w-5 transition-all duration-300 ${isOpen ? "rotate-90 opacity-0" : "rotate-0 opacity-100"}`} />
                  <X className={`absolute h-5 w-5 transition-all duration-300 ${isOpen ? "rotate-0 opacity-100" : "-rotate-90 opacity-0"}`} />
                </div>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ease-in-out md:hidden ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
      >
        <div className="absolute inset-0 bg-background/95 backdrop-blur-lg" onClick={() => setIsOpen(false)} />

        <div className="relative flex h-full flex-col items-center justify-center px-8">
          <div className="flex flex-col items-center space-y-6">
            {navigation.map((item, index) => (
              <div
                key={item.name}
                className={`transition-all duration-500 ${isOpen ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
                style={{
                  transitionDelay: `${index * 100}ms`,
                }}
              >
                <Button
                  variant={isActive(item) ? "default" : "ghost"}
                  size="lg"
                  className="min-w-[200px] rounded-full bg-gradient-to-r from-blue-500/5 to-purple-500/5 px-8 py-6 text-2xl transition-all duration-300 hover:scale-105 hover:from-blue-500/20 hover:to-purple-500/20"
                  asChild
                  onClick={() => setIsOpen(false)}
                >
                  <Link href={item.href}>{item.name}</Link>
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
