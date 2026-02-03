import { GitHubService } from '../src/services/github.service';
import { loadConfig } from '../src/utils/config-loader';

async function testScraping() {
  console.log('🧪 Testing GitHub Trending Scraper\n');

  const config = loadConfig();
  const githubService = new GitHubService(config);

  try {
    console.log('📡 Fetching trending repositories...\n');
    const repos = await githubService.fetchTrendingRepos();

    console.log(`✅ Found ${repos.length} trending repositories:\n`);

    repos.forEach((repo, index) => {
      console.log(`${index + 1}. ${repo.fullName}`);
      console.log(`   ⭐ Stars: ${repo.stars.toLocaleString()}`);
      console.log(`   📈 Stars today: ${repo.starsToday}`);
      console.log(`   💬 ${repo.description.substring(0, 80)}...`);
      console.log(`   🔗 ${repo.url}`);
      if (repo.language) {
        console.log(`   💻 Language: ${repo.language}`);
      }
      console.log('');
    });

    console.log('✅ Scraping test completed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testScraping();
