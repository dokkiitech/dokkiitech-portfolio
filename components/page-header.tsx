interface PageHeaderProps {
  eyebrow: string
  title: string
  lead?: string
  image?: string
}

/** 下層ページ共通の見出し。パンくず代わりの英字ラベル + H1 + リード文 */
export function PageHeader({ eyebrow, title, lead, image }: PageHeaderProps) {
  return (
    <section className="relative overflow-hidden border-b border-gray-200 bg-gray-50">
      {image && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="absolute inset-0 h-full w-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/60" aria-hidden />
        </>
      )}
      <div className="relative mx-auto max-w-7xl px-4 py-14 md:px-8 md:py-20">
        <p className="section-eyebrow">{eyebrow}</p>
        <h1 className="mt-3 text-[2rem] font-bold leading-[1.4] text-gray-900 md:text-5xl md:leading-[1.3]">{title}</h1>
        {lead && <p className="section-lead">{lead}</p>}
      </div>
    </section>
  )
}
