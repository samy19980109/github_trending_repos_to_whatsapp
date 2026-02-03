import type { TrendingRepo } from '../types';

export function formatIndividualMessage(repo: TrendingRepo): string {
  return `🌟 NEW TRENDING REPO #${repo.rank}

📦 ${repo.fullName}
⭐ ${repo.stars.toLocaleString()} stars (+${repo.starsToday.toLocaleString()} today)
💻 Language: ${repo.language || 'Not specified'}

📝 ${repo.description || 'No description available'}

🔗 ${repo.url}

---
Sent by GitHub Stars Bot`;
}

export function formatBatchSummary(repos: TrendingRepo[]): string {
  const header = `🔥 ${repos.length} NEW TRENDING REPOS TODAY!\n\n`;

  const list = repos
    .map((repo, index) =>
      `${index + 1}. ${repo.fullName} - ⭐ ${repo.starsToday.toLocaleString()} today`
    )
    .join('\n');

  return header + list;
}
