"use client"

import { HeroSection } from "@/components/sections/hero-section"
import { AboutSection } from "@/components/sections/about-section"
import { ProductsSection } from "@/components/sections/products-section"
import { BlogSection } from "@/components/sections/blog-section"
import { ContactSection } from "@/components/sections/contact-section"
import { DotNavigation } from "@/components/dot-navigation"
import { ScrollProgress } from "@/components/scroll-progress"
import { useEffect, useRef, useState } from "react"

export default function HomePage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeSection, setActiveSection] = useState(0)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleScroll = () => {
      const sections = container.querySelectorAll('.snap-section')
      const scrollPosition = container.scrollTop
      const windowHeight = window.innerHeight

      sections.forEach((section, index) => {
        const sectionTop = (section as HTMLElement).offsetTop
        const sectionBottom = sectionTop + windowHeight

        if (scrollPosition >= sectionTop - windowHeight / 2 && scrollPosition < sectionBottom - windowHeight / 2) {
          setActiveSection(index)
        }
      })
    }

    container.addEventListener('scroll', handleScroll)
    return () => container.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (index: number) => {
    const container = containerRef.current
    if (!container) return

    const sections = container.querySelectorAll('.snap-section')
    const targetSection = sections[index] as HTMLElement

    if (targetSection) {
      container.scrollTo({
        top: targetSection.offsetTop,
        behavior: 'smooth'
      })
    }
  }

  return (
    <>
      <ScrollProgress containerRef={containerRef as React.RefObject<HTMLDivElement>} />
      <DotNavigation
        sections={['Hero', 'About', 'Products', 'Blog', 'Contact']}
        activeSection={activeSection}
        onSectionClick={scrollToSection}
      />

      <div ref={containerRef} className="snap-container">
        <HeroSection containerRef={containerRef as React.RefObject<HTMLDivElement>} />
        <AboutSection />
        <ProductsSection />
        <BlogSection />
        <ContactSection />
      </div>
    </>
  )
}
