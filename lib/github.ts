interface GitHubRepo {
  language: string | null
}

export async function getFocusStackFromGitHub(username: string): Promise<string[]> {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN

  const response = await fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=updated`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    next: { revalidate: 3600 },
  })

  if (!response.ok) {
    throw new Error(`GitHub API error: ${response.status}`)
  }

  const repos = (await response.json()) as GitHubRepo[]
  const counts = new Map<string, number>()

  for (const repo of repos) {
    const language = repo.language
    if (!language) continue
    counts.set(language, (counts.get(language) || 0) + 1)
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([language]) => language)
    .slice(0, 8)
}
