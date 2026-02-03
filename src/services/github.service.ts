import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';
import type { TrendingRepo, Config } from '../types';
import { logger } from '../utils/logger';

export class GitHubService {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  public async fetchTrendingRepos(): Promise<TrendingRepo[]> {
    const maxRetries = 3;
    const retryDelay = 2000;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.info({ attempt }, 'Fetching trending repos from GitHub');

        let url = 'https://github.com/trending';
        if (this.config.github.language) {
          url += `/${this.config.github.language}`;
        }
        url += `?since=${this.config.github.since}`;

        const response = await axios.get(url, {
          timeout: 10000,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
          },
        });

        const $ = cheerio.load(response.data);
        const repos: TrendingRepo[] = [];

        $('article.Box-row').each((index, element) => {
          if (index >= this.config.github.topN) {
            return false;
          }

          const $article = $(element);

          const repoLink = $article.find('h2 a').attr('href');
          if (!repoLink) return;

          const fullName = repoLink.replace(/^\//, '');
          const [author, name] = fullName.split('/');

          const description = $article.find('p').first().text().trim();

          const language = $article.find('[itemprop="programmingLanguage"]').text().trim();

          const starsText = $article.find('a[href*="/stargazers"]').first().text().trim();
          const stars = this.parseStarCount(starsText);

          const starsTodayElement = $article.find('span.d-inline-block.float-sm-right');
          let starsToday = 0;
          starsTodayElement.each((_, el) => {
            const text = $(el).text();
            if (text.includes('stars today') || text.includes('stars this week') || text.includes('stars this month')) {
              starsToday = this.parseStarCount(text);
            }
          });

          repos.push({
            fullName,
            author,
            name,
            url: `https://github.com${repoLink}`,
            description,
            language,
            stars,
            starsToday,
            rank: index + 1,
          });
        });

        logger.info({ count: repos.length }, 'Successfully fetched trending repos');
        return repos;
      } catch (error) {
        const isLastAttempt = attempt === maxRetries;

        if (axios.isAxiosError(error)) {
          const axiosError = error as AxiosError;
          logger.error(
            {
              attempt,
              status: axiosError.response?.status,
              message: axiosError.message,
            },
            'Failed to fetch trending repos'
          );
        } else {
          logger.error({ attempt, error }, 'Failed to fetch trending repos');
        }

        if (isLastAttempt) {
          throw new Error(`Failed to fetch trending repos after ${maxRetries} attempts`);
        }

        logger.info({ delay: retryDelay }, 'Retrying after delay');
        await this.sleep(retryDelay);
      }
    }

    throw new Error('Failed to fetch trending repos');
  }

  private parseStarCount(text: string): number {
    const match = text.match(/([\d,]+)/);
    if (!match) return 0;
    return parseInt(match[1].replace(/,/g, ''), 10);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
