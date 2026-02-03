import { GitHubService } from '../src/services/github.service';
import { loadConfig } from '../src/utils/config-loader';

async function runTest() {
    try {
        const config = loadConfig();
        const githubService = new GitHubService(config);

        console.log('🚀 Fetching trending repositories using GitHubService...\n');
        const repos = await githubService.fetchTrendingRepos();

        if (repos.length === 0) {
            console.log('⚠️ No trending repositories found.');
        } else {
            console.log(`✅ Found ${repos.length} trending repositories:\n`);
            console.dir(repos, { depth: null, colors: true });
        }
    } catch (error) {
        console.error('❌ Error fetching trending repos:', error);
    }
}

runTest();