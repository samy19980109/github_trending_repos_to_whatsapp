"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const baileys_1 = __importStar(require("@whiskeysockets/baileys"));
const fs_1 = require("fs");
const path_1 = require("path");
async function setup() {
    console.log('🚀 GitHub Stars WhatsApp Notifier - Setup\n');
    // Load config
    const configPath = (0, path_1.resolve)(__dirname, '../config.json');
    const config = JSON.parse((0, fs_1.readFileSync)(configPath, 'utf-8'));
    console.log(`📱 Phone number: ${config.whatsapp.phoneNumber}`);
    console.log(`📂 Auth directory: ${config.storage.authDir}\n`);
    console.log('⏳ Initializing WhatsApp connection...\n');
    const { state, saveCreds } = await (0, baileys_1.useMultiFileAuthState)(config.storage.authDir);
    const sock = (0, baileys_1.default)({
        auth: state,
        printQRInTerminal: true,
    });
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log('\n📱 Scan the QR code above with WhatsApp (Linked Devices)\n');
        }
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== baileys_1.DisconnectReason.loggedOut;
            console.log('❌ Connection closed', { shouldReconnect });
            if (!shouldReconnect) {
                console.log('\n✅ Setup complete! Credentials saved.\n');
                console.log('📝 Next steps:');
                console.log('   1. Edit config.json and set your phone number');
                console.log('   2. Run: npm run test');
                console.log('   3. Run: npm start\n');
                process.exit(0);
            }
        }
        else if (connection === 'open') {
            console.log('\n✅ Connected to WhatsApp!\n');
            console.log('📤 Sending test message...\n');
            try {
                const jid = `${config.whatsapp.phoneNumber}@s.whatsapp.net`;
                await sock.sendMessage(jid, {
                    text: '✅ GitHub Stars WhatsApp Notifier is now set up!\n\nYou will receive notifications for trending GitHub repositories every 6 hours.',
                });
                console.log('✅ Test message sent successfully!\n');
                console.log('📝 Setup complete. You can now:');
                console.log('   1. Run: npm run test (to test notifications)');
                console.log('   2. Run: npm start (for manual run)');
                console.log('   3. Set up cron/launchd for automated runs\n');
            }
            catch (error) {
                console.error('❌ Failed to send test message:', error);
            }
            await sock.logout();
            process.exit(0);
        }
    });
}
setup().catch((error) => {
    console.error('❌ Setup failed:', error);
    process.exit(1);
});
