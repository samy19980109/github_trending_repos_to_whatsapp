# GitHub Stars WhatsApp Notifier

A TypeScript-based cron job that monitors GitHub's top 10 trending repositories and sends WhatsApp notifications via Baileys every 6 hours.

## Features

- 📊 Fetches top 10 trending GitHub repositories
- 📱 Sends WhatsApp notifications using Baileys
- 🔄 Runs as a cron job every 6 hours
- 🎯 Avoids duplicate notifications (24-hour window)
- 🗄️ Persistent storage for tracking sent repos
- 🔐 Secure WhatsApp authentication

## Prerequisites

- Node.js 18+ and npm
- WhatsApp account
- macOS (for launchd scheduling)

## Installation

1. **Clone/navigate to the project directory**:
   ```bash
   cd /Users/samarthagarwal/dev/github_stars
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Build the project**:
   ```bash
   npm run build
   ```

## Configuration

1. **Edit `config.json`** and set your phone number:
   ```json
   {
     "whatsapp": {
       "phoneNumber": "919876543210",  // Your number in international format
       ...
     }
   }
   ```

   Format: Country code + number (no spaces, no +)
   Examples:
   - India: `919876543210`
   - US: `12025551234`

## Setup

1. **Authenticate WhatsApp**:
   ```bash
   npm run setup
   ```

   This will:
   - Display a QR code in your terminal
   - Wait for you to scan it with WhatsApp (Linked Devices)
   - Save credentials to `auth_info_baileys/`
   - Send a test message to verify connection

2. **Test notifications**:
   ```bash
   npm run test
   ```

   This sends a mock trending repo notification to verify everything works.

3. **Manual run**:
   ```bash
   npm start
   ```

   This runs the notifier once manually (useful for testing).

## Scheduling (Cron Setup)

### Option A: macOS launchd (Recommended)

1. **Create launchd plist file**:
   ```bash
   nano ~/Library/LaunchAgents/com.github.stars.notifier.plist
   ```

2. **Add the following content** (replace paths if needed):
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>Label</key>
       <string>com.github.stars.notifier</string>
       <key>ProgramArguments</key>
       <array>
           <string>/usr/local/bin/node</string>
           <string>/Users/samarthagarwal/dev/github_stars/dist/src/index.js</string>
       </array>
       <key>StartInterval</key>
       <integer>21600</integer>
       <key>WorkingDirectory</key>
       <string>/Users/samarthagarwal/dev/github_stars</string>
       <key>StandardOutPath</key>
       <string>/Users/samarthagarwal/dev/github_stars/logs/launchd.log</string>
       <key>StandardErrorPath</key>
       <string>/Users/samarthagarwal/dev/github_stars/logs/launchd-error.log</string>
   </dict>
   </plist>
   ```

3. **Load the launch agent**:
   ```bash
   launchctl load ~/Library/LaunchAgents/com.github.stars.notifier.plist
   ```

4. **Verify it's loaded**:
   ```bash
   launchctl list | grep github.stars
   ```

5. **Start immediately** (optional):
   ```bash
   launchctl start com.github.stars.notifier
   ```

6. **To stop/unload**:
   ```bash
   launchctl unload ~/Library/LaunchAgents/com.github.stars.notifier.plist
   ```

### Option B: crontab

1. **Open crontab editor**:
   ```bash
   crontab -e
   ```

2. **Add the following line**:
   ```bash
   0 */6 * * * cd /Users/samarthagarwal/dev/github_stars && node dist/src/index.js >> logs/cron.log 2>&1
   ```

   This runs every 6 hours at the top of the hour (12:00 AM, 6:00 AM, 12:00 PM, 6:00 PM).

## Monitoring

### View Logs

```bash
# Application logs
tail -f logs/app.log

# Launchd logs (if using launchd)
tail -f logs/launchd.log
```

### Check Sent Repos

```bash
cat data/sent-repos.json
```

### Verify WhatsApp Auth

```bash
ls -la auth_info_baileys/
```

## Project Structure

```
/Users/samarthagarwal/dev/github_stars/
├── package.json
├── tsconfig.json
├── .gitignore
├── config.json                    # Your configuration
├── config.example.json            # Template
├── README.md
├── src/
│   ├── index.ts                   # Main entry point
│   ├── services/
│   │   ├── github.service.ts      # Fetch trending repos
│   │   ├── whatsapp.service.ts    # WhatsApp messaging
│   │   └── storage.service.ts     # Track sent repos
│   ├── types/
│   │   └── index.ts               # TypeScript interfaces
│   └── utils/
│       ├── logger.ts              # Pino logging
│       └── formatter.ts           # Message formatting
├── data/
│   └── sent-repos.json            # Tracks sent repos
├── logs/
│   └── app.log                    # Application logs
├── auth_info_baileys/             # WhatsApp credentials
└── scripts/
    ├── setup.ts                   # QR code authentication
    └── test-notification.ts       # Test script
```

## Troubleshooting

### WhatsApp Session Expired

If you get "Logged out, please re-authenticate":

```bash
rm -rf auth_info_baileys/
npm run setup
```

### No Messages Received

1. Check logs: `tail -f logs/app.log`
2. Verify phone number format in `config.json`
3. Run test: `npm run test`
4. Check if WhatsApp Web is working on your phone

### Cron Not Running

For launchd:
```bash
# Check if loaded
launchctl list | grep github.stars

# Check logs
tail -f logs/launchd-error.log
```

For crontab:
```bash
# Verify cron entry
crontab -l

# Check logs
tail -f logs/cron.log
```

## Development

### Run in Development Mode

```bash
npm run dev
```

This uses `tsx` to run TypeScript directly without building.

### Modify Configuration

Edit `config.json` to change:
- Phone number
- Message delay (default: 300ms)
- Number of top repos (default: 10)
- GitHub API parameters

## Security Notes

- `auth_info_baileys/` contains WhatsApp credentials - keep it secure
- `config.json` contains your phone number - don't commit to git
- All sensitive files are in `.gitignore`

## License

ISC
