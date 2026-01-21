"use client"

interface DotNavigationProps {
  sections: string[]
  activeSection: number
  onSectionClick: (index: number) => void
}

export function DotNavigation({ sections, activeSection, onSectionClick }: DotNavigationProps) {
  return (
    <nav className="fixed right-8 top-1/2 -translate-y-1/2 z-50 hidden md:block">
      <ul className="space-y-4">
        {sections.map((section, index) => (
          <li key={section}>
            <button
              onClick={() => onSectionClick(index)}
              className="group relative flex items-center"
              aria-label={`Go to ${section} section`}
            >
              {/* ドット */}
              <div
                className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                  activeSection === index
                    ? 'bg-primary border-primary scale-125'
                    : 'bg-transparent border-muted-foreground hover:border-primary hover:scale-110'
                }`}
              />

              {/* ラベル（ホバー時に表示） */}
              <span
                className={`absolute right-6 px-3 py-1 bg-card border border-border rounded-md text-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200 ${
                  activeSection === index ? 'text-primary font-medium' : 'text-muted-foreground'
                }`}
              >
                {section}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}
