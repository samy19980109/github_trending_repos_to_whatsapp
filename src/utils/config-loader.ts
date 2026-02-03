import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import type { Config } from '../types';

function findProjectRoot(startPath: string): string {
  let currentPath = startPath;

  // Look for config.json going up the directory tree
  while (currentPath !== dirname(currentPath)) {
    const configPath = resolve(currentPath, 'config.json');
    if (existsSync(configPath)) {
      return currentPath;
    }
    currentPath = dirname(currentPath);
  }

  throw new Error('Could not find project root (config.json not found)');
}

export function loadConfig(): Config {
  const projectRoot = findProjectRoot(__dirname);
  const configPath = resolve(projectRoot, 'config.json');
  return JSON.parse(readFileSync(configPath, 'utf-8'));
}
