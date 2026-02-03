# Quick Start Guide

Follow these steps to get your GitHub Stars WhatsApp Notifier running in 5 minutes:

## Step 1: Configure Your Phone Number

Edit `config.json` and replace the phone number with yours:

```json
{
  "whatsapp": {
    "phoneNumber": "919876543210",  // <- Change this to your number
    ...
  }
}
```

**Format**: Country code + number (no spaces, no +)

Examples:
- India: `919876543210`
- US: `12025551234`
- UK: `447911123456`

## Step 2: Authenticate WhatsApp

```bash
npm run setup
```

1. A QR code will appear in your terminal
2. Open WhatsApp on your phone
3. Go to Settings → Linked Devices → Link a Device
4. Scan the QR code
5. Wait for "Connected to WhatsApp!" message

A test message will be sent to your WhatsApp.

## Step 3: Test It

```bash
npm run test
```

This sends a mock trending repo notification. Check your WhatsApp!

## Step 4: Run Manually (Optional)

```bash
npm start
```

This fetches real trending repos and sends notifications for new ones.

## Step 5: Schedule Automated Runs

### Option A: Using launchd (macOS - Recommended)

```bash
# Copy the plist file to LaunchAgents
cp com.github.stars.notifier.plist ~/Library/LaunchAgents/

# Load it
launchctl load ~/Library/LaunchAgents/com.github.stars.notifier.plist

# Verify it's loaded
launchctl list | grep github.stars
```

The notifier will now run every 6 hours automatically!

### Option B: Using crontab

```bash
# Open crontab editor
crontab -e

# Add this line (press 'i' to insert, then paste):
0 */6 * * * cd /Users/samarthagarwal/dev/github_stars && node dist/src/index.js >> logs/cron.log 2>&1

# Save and exit (press ESC, then type :wq and press ENTER)
```

## Monitoring

### View Logs

```bash
tail -f logs/app.log
```

### Check What Was Sent

```bash
cat data/sent-repos.json | jq .
```

(Install jq if needed: `brew install jq`)

## Troubleshooting

### Issue: WhatsApp session expired

**Solution:**
```bash
rm -rf auth_info_baileys/
npm run setup
```

### Issue: No messages received

**Check:**
1. Phone number format correct? (no spaces, no +)
2. WhatsApp Web working on phone?
3. Check logs: `tail -f logs/app.log`

### Issue: Cron not running

**For launchd:**
```bash
# Check if loaded
launchctl list | grep github.stars

# Check error logs
tail -f logs/launchd-error.log
```

**For crontab:**
```bash
# Check cron entry exists
crontab -l
```

## What Happens Next?

1. Every 6 hours, the script runs automatically
2. It fetches top 10 trending GitHub repos
3. Filters out repos already sent in last 24 hours
4. Sends WhatsApp messages for new trending repos
5. Tracks sent repos to avoid duplicates

## Customization

Edit `config.json` to change:
- `messageDelay`: Time between messages (default: 300ms)
- `topN`: Number of repos to fetch (default: 10)
- `since`: Trending period - "daily", "weekly", "monthly"
- `language`: Filter by language (e.g., "typescript", "python", "")

## Need Help?

Check the full [README.md](README.md) for detailed documentation.

Enjoy your GitHub trending repo notifications! 🚀
