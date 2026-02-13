import { existsSync } from 'fs';
import { resolve } from 'path';
import { logger } from './utils/logger';
import { loadConfig } from './utils/config-loader';
import { formatIndividualMessage } from './utils/formatter';
import { GitHubService } from './services/github.service';
import { WhatsAppService } from './services/whatsapp.service';
import { StorageService } from './services/storage.service';

async function main() {
  try {
    // 1. Load config
    logger.info('Starting GitHub Stars WhatsApp Notifier');
    const config = loadConfig();

    // 2. Check auth credentials exist
    const authDir = resolve(config.storage.authDir);
    if (!existsSync(authDir)) {
      logger.error('WhatsApp auth directory not found. Please run setup first.');
      process.exit(1);
    }

    // 3. Fetch top 10 trending repos from GitHub API
    const githubService = new GitHubService(config);
    const trendingRepos = await githubService.fetchTrendingRepos();

    // 4. Load sent repos tracking data
    const storageService = new StorageService(config.storage.sentReposFile);
    const sentData = storageService.loadSentRepos();

    // 5. Filter out repos sent in last 24 hours
    const newRepos = storageService.filterNewRepos(trendingRepos, sentData);

    // 6. If no new repos: log and exit(0)
    if (newRepos.length === 0) {
      logger.info('No new trending repos to notify');
      process.exit(0);
    }

    logger.info({ count: newRepos.length }, 'Found new trending repos to notify');

    // 7. Connect to WhatsApp (30s timeout)
    const whatsappService = new WhatsAppService(config);
    await whatsappService.connect(30000);

    // 7b. Resolve target JID (group or direct message)
    let targetJid: string;
    if (config.whatsapp.groupName) {
      targetJid = await whatsappService.findGroupByName(config.whatsapp.groupName);
    } else {
      targetJid = `${config.whatsapp.phoneNumber}@s.whatsapp.net`;
    }

    // 8. Send messages with delays
    const messages = newRepos.map((repo) => formatIndividualMessage(repo));
    await whatsappService.sendMessages(targetJid, messages);

    // 9. Update sent repos JSON
    storageService.addSentRepos(newRepos);

    // 10. Close connection
    await whatsappService.disconnect();

    logger.info('Successfully completed notification run');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Fatal error in main execution');
    process.exit(1);
  }
}

main();
