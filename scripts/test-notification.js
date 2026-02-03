"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const whatsapp_service_1 = require("../src/services/whatsapp.service");
const formatter_1 = require("../src/utils/formatter");
async function testNotification() {
    console.log('🧪 Testing GitHub Stars WhatsApp Notification\n');
    // Load config
    const configPath = (0, path_1.resolve)(__dirname, '../config.json');
    const config = JSON.parse((0, fs_1.readFileSync)(configPath, 'utf-8'));
    // Check auth exists
    const authDir = (0, path_1.resolve)(config.storage.authDir);
    if (!(0, fs_1.existsSync)(authDir)) {
        console.error('❌ WhatsApp auth directory not found. Please run setup first.');
        process.exit(1);
    }
    console.log('📱 Phone number:', config.whatsapp.phoneNumber);
    console.log('⏳ Connecting to WhatsApp...\n');
    try {
        const whatsappService = new whatsapp_service_1.WhatsAppService(config);
        await whatsappService.connect(30000);
        console.log('✅ Connected!\n');
        console.log('📤 Sending test notification...\n');
        // Create a mock trending repo
        const mockRepo = {
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
        const message = (0, formatter_1.formatIndividualMessage)(mockRepo);
        await whatsappService.sendMessage(config.whatsapp.phoneNumber, message);
        console.log('✅ Test notification sent successfully!\n');
        console.log('📱 Check your WhatsApp to verify the message was received.\n');
        await whatsappService.disconnect();
        console.log('👋 Disconnected from WhatsApp\n');
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}
testNotification();
