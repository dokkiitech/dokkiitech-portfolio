interface GitHubRepo {
  full_name: string
  languages_url: string
}

export interface FocusStackItem {
  language: string
  percentage: number
}

async function fetchWithAuth(url: string, token: string | undefined) {
  return fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    next: { revalidate: 3600 },
  })
}

async function fetchAllRepos(token?: string, username?: string): Promise<GitHubRepo[]> {
  const repos: GitHubRepo[] = []
  let page = 1

  while (page <= 5) {
    const endpoint = token
      ? `https://api.github.com/user/repos?per_page=100&page=${page}&visibility=all&affiliation=owner,collaborator,organization_member`
      : `https://api.github.com/users/${username}/repos?per_page=100&page=${page}&sort=updated`

    const response = await fetchWithAuth(endpoint, token)
    if (!response.ok) throw new Error(`GitHub repos API error: ${response.status}`)
    const rows = (await response.json()) as GitHubRepo[]
    repos.push(...rows)
    if (rows.length < 100) break
    page += 1
  }

  return repos
}

export async function getFocusStackFromGitHub(username: string): Promise<FocusStackItem[]> {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN
  const repos = await fetchAllRepos(token, username)
  if (repos.length === 0) return []

  const languageBytes = new Map<string, number>()

  for (const repo of repos) {
    const response = await fetchWithAuth(repo.languages_url, token)
    if (!response.ok) continue
    const languages = (await response.json()) as Record<string, number>
    for (const [language, bytes] of Object.entries(languages)) {
      languageBytes.set(language, (languageBytes.get(language) || 0) + bytes)
    }
  }

  const total = [...languageBytes.values()].reduce((sum, value) => sum + value, 0)
  if (total === 0) return []

  return [...languageBytes.entries()]
    .map(([language, bytes]) => ({
      language,
      percentage: Number(((bytes / total) * 100).toFixed(1)),
    }))
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 8)
}
