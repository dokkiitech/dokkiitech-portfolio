export interface ZennArticle {
  title: string
  link: string
  pubDate: string
  description: string
  thumbnail?: string
  tags: string[]
}

interface ZennApiItem {
  title?: string
  link?: string
  pubDate?: string
  description?: string
  thumbnail?: string
  categories?: string[]
}

const ZENN_REVALIDATE_SECONDS = 3600
const FETCH_TIMEOUT_MS = 5000

export async function getZennArticles(username: string, tag?: string): Promise<ZennArticle[]> {
  const feedUrl = `https://zenn.dev/${username}/feed`

  const strategies = [
    async () => parseRSSFeed(await fetchText(feedUrl)),
    async () => parseRss2JsonFeed(await fetchJson(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(feedUrl)}`)),
  ]

  for (const strategy of strategies) {
    try {
      const articles = await strategy()
      if (!articles.length) continue
      return filterByTag(articles, tag)
    } catch (error) {
      console.error("Error fetching Zenn articles:", error)
    }
  }

  return filterByTag(parseFallbackArticles(), tag)
}

export async function getZennProductArticles(username: string, limit?: number): Promise<ZennArticle[]> {
  const articles = await getZennArticles(username, 'product')
  return limit ? articles.slice(0, limit) : articles
}

function filterByTag(articles: ZennArticle[], tag?: string): ZennArticle[] {
  if (!tag) return articles
  return articles.filter((article) => article.tags.some((item) => item.toLowerCase() === tag.toLowerCase()))
}

async function fetchText(url: string): Promise<string> {
  const response = await fetchWithTimeout(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }
  return response.text()
}

async function fetchJson(url: string): Promise<{ items?: ZennApiItem[] }> {
  const response = await fetchWithTimeout(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }
  return response.json()
}

async function fetchWithTimeout(url: string): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
  try {
    return await fetch(url, {
      signal: controller.signal,
      next: { revalidate: ZENN_REVALIDATE_SECONDS },
      headers: {
        "User-Agent": "dokkiitech-portfolio-zenn-fetcher",
      },
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

function parseRSSFeed(xml: string): ZennArticle[] {
  const articles: ZennArticle[] = []

  // <item>タグを抽出
  const itemRegex = /<item>([\s\S]*?)<\/item>/g
  const items = xml.match(itemRegex)

  if (!items) return articles

  for (const item of items) {
    // 各フィールドを抽出
    const title = extractTag(item, 'title')
    const link = extractTag(item, 'link')
    const pubDate = extractTag(item, 'pubDate')
    const description = extractTag(item, 'description')

    // サムネイル画像を抽出（og:imageから）
    const thumbnailMatch = item.match(/<media:thumbnail url="([^"]+)"/)
    const thumbnail = thumbnailMatch ? thumbnailMatch[1] : undefined

    // タグ（カテゴリ）を抽出
    const tags = extractCategories(item)

    if (title && link && pubDate) {
      articles.push({
        title: stripHTMLTags(decodeHTMLEntities(title)),
        link,
        pubDate,
        description: stripHTMLTags(decodeHTMLEntities(description || '')),
        thumbnail,
        tags,
      })
    }
  }

  return articles
}

function parseRss2JsonFeed(json: { items?: ZennApiItem[] }): ZennArticle[] {
  if (!json.items?.length) return []
  return json.items
    .map((item) => {
      if (!item.title || !item.link || !item.pubDate) return null
      return {
        title: stripHTMLTags(decodeHTMLEntities(item.title)),
        link: item.link,
        pubDate: item.pubDate,
        description: stripHTMLTags(decodeHTMLEntities(item.description || "")),
        thumbnail: item.thumbnail,
        tags: item.categories || [],
      } satisfies ZennArticle
    })
    .filter((item): item is ZennArticle => Boolean(item))
}

function extractTag(xml: string, tagName: string): string {
  const regex = new RegExp(`<${tagName}[^>]*>([\\s\\S]*?)<\/${tagName}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1].trim() : ''
}

function extractCategories(xml: string): string[] {
  const categoryRegex = /<category>(.*?)<\/category>/gi
  const matches = xml.matchAll(categoryRegex)
  const categories: string[] = []

  for (const match of matches) {
    if (match[1]) {
      categories.push(stripHTMLTags(decodeHTMLEntities(match[1])))
    }
  }

  return categories
}

function decodeHTMLEntities(text: string): string {
  const entities: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
  }

  return text.replace(/&[^;]+;/g, (entity) => entities[entity] || entity)
}

function stripHTMLTags(text: string): string {
  // CDATAセクションの内容を抽出
  let cleaned = text.replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
  // HTMLタグを除去
  cleaned = cleaned.replace(/<[^>]*>/g, '')
  return cleaned.trim()
}

function parseFallbackArticles(): ZennArticle[] {
  const raw = process.env.ZENN_FALLBACK_ARTICLES_JSON
  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((item) => {
        if (
          !item ||
          typeof item !== "object" ||
          !("title" in item) ||
          !("link" in item) ||
          !("pubDate" in item)
        ) {
          return null
        }

        const candidate = item as Partial<ZennArticle>
        return {
          title: String(candidate.title),
          link: String(candidate.link),
          pubDate: String(candidate.pubDate),
          description: String(candidate.description || ""),
          thumbnail: candidate.thumbnail ? String(candidate.thumbnail) : undefined,
          tags: Array.isArray(candidate.tags) ? candidate.tags.map(String) : [],
        } satisfies ZennArticle
      })
      .filter((item): item is ZennArticle => Boolean(item))
  } catch (error) {
    console.error("Invalid ZENN_FALLBACK_ARTICLES_JSON:", error)
    return []
  }
}
