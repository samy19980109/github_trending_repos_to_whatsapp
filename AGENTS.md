# AGENTS.md - Development Guidelines

This document provides guidance for AI agents working on this codebase.

## Project Overview

TypeScript-based WhatsApp notification bot that scrapes GitHub trending repositories and sends WhatsApp notifications. Built with CommonJS (not ESM).

## Build, Run & Test Commands

```bash
# Build TypeScript to dist/
npm run build

# Build and run the notifier once
npm start

# Run with tsx (no build, for development)
npm run dev

# Initial WhatsApp QR authentication
npm run setup

# Send test notification with mock data
npm run test

# List all WhatsApp groups (to find exact group name)
npm run list-groups

# Test GitHub scraping without WhatsApp
tsx scripts/test-scraping.ts
```

## Code Style Guidelines

### General Principles
- **No comments** unless absolutely necessary for understanding
- Use **2-space indentation**
- Use **single quotes** for strings
- Use **camelCase** for variables, functions, and methods
- Use **PascalCase** for class names and interfaces
- Use **SCREAMING_SNAKE_CASE** for constants

### Imports
Order imports as follows:
1. External libraries (axios, cheerio, baileys, etc.)
2. Internal modules (services, utils, types)

```typescript
// External
import axios from 'axios';
import * as cheerio from 'cheerio';

// Internal
import { GitHubService } from './services/github.service';
import { logger } from './utils/logger';
import type { Config } from '../types';
```

### TypeScript Types
- Always define explicit return types for public methods
- Use interfaces for data structures (not types)
- Use `type` for unions, intersections, and primitives
- Always import types using `import type` syntax

```typescript
// Good
export interface TrendingRepo {
  fullName: string;
  stars: number;
}

// Good - type for primitivesions
export/un type LogLevel = 'info' | 'warn' | 'error';
```

### Error Handling
- Always wrap async operations in try/catch
- Use the logger for all errors and important events
- Re-throw errors with context after logging

```typescript
try {
  const result = await someAsyncOperation();
  return result;
} catch (error) {
  logger.error({ error, attempt }, 'Operation failed');
  throw new Error(`Operation failed after ${attempt} attempts`);
}
```

### Logging
- Use the pino logger from `src/utils/logger`
- Always include relevant context in log objects
- Use appropriate log levels:
  - `logger.info` for normal operation flow
  - `logger.warn` for recoverable issues
  - `logger.error` for failures

```typescript
logger.info({ count: repos.length }, 'Successfully fetched repos');
logger.error({ error, attempt }, 'Failed to fetch repos');
```

### Service Classes
- Create one class per file
- Name files after the class (e.g., `GitHubService` → `github.service.ts`)
- Use dependency injection via constructor
- Keep methods focused and small

```typescript
export class GitHubService {
  private config: Config;

  constructor(config: Config) {
    this.config = config;
  }

  public async fetchTrendingRepos(): Promise<TrendingRepo[]> {
    // implementation
  }
}
```

### Configuration
- All config comes from `config.json` (loaded via `src/utils/config-loader.ts`)
- Never hardcode configuration values
- Config types are defined in `src/types/index.ts`

### WhatsApp Integration
- Use `@whiskeysockets/baileys` library
- Always fetch latest WhatsApp Web version using `fetchLatestWaWebVersion()`
- Use `useMultiFileAuthState` for credential persistence
- Handle connection updates via event listeners
- Always disconnect after sending messages

### GitHub Scraping
- Uses Cheerio for HTML parsing (not the trending-github npm package)
- Scrapes `https://github.com/trending` directly
- Retry failed requests up to 3 times with 2s delays

### Testing
- No formal test framework currently
- Use `npm run test` to send a test notification
- Use `npm run dev` for development with live reload
- Check `logs/app.log` for runtime logs

### File Organization
```
src/
├── index.ts              # Main entry point
├── services/            # Business logic
│   ├── github.service.ts
│   ├── whatsapp.service.ts
│   └── storage.service.ts
├── types/               # TypeScript interfaces
│   └── index.ts
└── utils/               # Utilities
    ├── logger.ts
    ├── config-loader.ts
    └── formatter.ts

scripts/
├── setup.ts             # WhatsApp authentication
├── test-notification.ts # Send test message
└── list-groups.ts       # List WhatsApp groups
```

### Common Tasks

**Adding a new service:**
1. Create `src/services/<name>.service.ts`
2. Define interface in `src/types/index.ts`
3. Export class with dependency injection
4. Add to main flow in `src/index.ts`

**Modifying config:**
1. Edit `config.json` (gitignored)
2. Update type in `src/types/index.ts` if needed
3. No code changes required for new config fields

**Debugging:**
```bash
# View application logs
tail -f logs/app.log

# Run in development mode
npm run dev

# Test scraping independently
tsx scripts/test-scraping.ts
```

## Key Dependencies
- `@whiskeysockets/baileys` - WhatsApp Web client
- `cheerio` - HTML parsing
- `axios` - HTTP requests
- `pino` - Logging
- `tsx` - TypeScript executor for development
