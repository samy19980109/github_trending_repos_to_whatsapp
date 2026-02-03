import { readFileSync, writeFileSync, existsSync, mkdirSync, renameSync } from 'fs';
import { dirname, resolve } from 'path';
import type { SentReposData, SentRepo, TrendingRepo } from '../types';
import { logger } from '../utils/logger';

export class StorageService {
  private filePath: string;

  constructor(filePath: string) {
    this.filePath = resolve(filePath);
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  public loadSentRepos(): SentReposData {
    try {
      if (!existsSync(this.filePath)) {
        logger.info('No sent repos file found, creating new one');
        return {
          lastCheck: new Date().toISOString(),
          sentRepositories: [],
        };
      }

      const data = readFileSync(this.filePath, 'utf-8');
      const parsed: SentReposData = JSON.parse(data);

      // Clean up old entries (older than 7 days)
      const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      parsed.sentRepositories = parsed.sentRepositories.filter(
        (repo) => new Date(repo.sentAt).getTime() > sevenDaysAgo
      );

      return parsed;
    } catch (error) {
      logger.error({ error }, 'Failed to load sent repos, starting fresh');
      return {
        lastCheck: new Date().toISOString(),
        sentRepositories: [],
      };
    }
  }

  public saveSentRepos(data: SentReposData): void {
    try {
      const tempFile = `${this.filePath}.tmp`;
      writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf-8');
      renameSync(tempFile, this.filePath);
      logger.info('Sent repos data saved successfully');
    } catch (error) {
      logger.error({ error }, 'Failed to save sent repos data');
      throw error;
    }
  }

  public filterNewRepos(
    trendingRepos: TrendingRepo[],
    sentData: SentReposData
  ): TrendingRepo[] {
    const twentyFourHoursAgo = Date.now() - 24 * 60 * 60 * 1000;

    const recentlySentRepos = new Set(
      sentData.sentRepositories
        .filter((repo) => new Date(repo.sentAt).getTime() > twentyFourHoursAgo)
        .map((repo) => repo.fullName)
    );

    return trendingRepos.filter(
      (repo) => !recentlySentRepos.has(repo.fullName)
    );
  }

  public addSentRepos(repos: TrendingRepo[]): void {
    const data = this.loadSentRepos();
    const now = new Date().toISOString();

    const newSentRepos: SentRepo[] = repos.map((repo) => ({
      fullName: repo.fullName,
      stars: repo.stars,
      starsToday: repo.starsToday,
      sentAt: now,
      rank: repo.rank,
    }));

    data.sentRepositories.push(...newSentRepos);
    data.lastCheck = now;

    this.saveSentRepos(data);
  }
}
