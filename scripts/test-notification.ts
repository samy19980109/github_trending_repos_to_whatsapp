import { existsSync } from 'fs';
import { resolve } from 'path';
import type { TrendingRepo } from '../src/types';
import { WhatsAppService } from '../src/services/whatsapp.service';
import { formatIndividualMessage } from '../src/utils/formatter';
import { loadConfig } from '../src/utils/config-loader';

async function testNotification() {
  console.log('🧪 Testing GitHub Stars WhatsApp Notification\n');

  // Load config
  const config = loadConfig();

  // Check auth exists
  const authDir = resolve(config.storage.authDir);
  if (!existsSync(authDir)) {
    console.error('❌ WhatsApp auth directory not found. Please run setup first.');
    process.exit(1);
  }

  console.log('⏳ Connecting to WhatsApp...\n');

  try {
    const whatsappService = new WhatsAppService(config);
    await whatsappService.connect(30000);

    console.log('✅ Connected!\n');

    // Resolve target JID (group or direct message)
    let targetJid: string;
    if (config.whatsapp.groupName) {
      targetJid = await whatsappService.findGroupByName(config.whatsapp.groupName);
      console.log(`📱 Sending to group: ${config.whatsapp.groupName}\n`);
    } else {
      targetJid = `${config.whatsapp.phoneNumber}@s.whatsapp.net`;
      console.log(`📱 Sending to phone: ${config.whatsapp.phoneNumber}\n`);
    }

    console.log('📤 Sending test notification...\n');

    // Create a mock trending repo
    const mockRepo: TrendingRepo = {
      fullName: 'facebook/react',
      author: 'facebook',
      name: 'react',
      url: 'https://github.com/facebook/react',
      description: 'A declarative, efficient, and flexible JavaScript library for building user interfaces.',
      language: 'JavaScript',
      stars: 230000,
      starsToday: 150,
      rank: 1,
    };

    const message = formatIndividualMessage(mockRepo);
    await whatsappService.sendMessage(targetJid, message);

    console.log('✅ Test notification sent successfully!\n');
    console.log('📱 Check your WhatsApp to verify the message was received.\n');

    await whatsappService.disconnect();
    console.log('👋 Disconnected from WhatsApp\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

testNotification();
