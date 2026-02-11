---
description: Deploy code changes to the mobile app via EAS Update
---
# Deploy to Mobile (EAS Update)

The installed APK on the phone is a **preview** build. Always push updates to the `preview` branch.

// turbo-all

1. Push the update:
```bash
cd c:\Users\USER\Desktop\Turn-Pro-Poker\frontend && npx eas-cli update --branch preview --message "DESCRIBE_CHANGES_HERE" --non-interactive
```

2. Tell the user to **close and reopen** the app on their phone. The update downloads on first launch and applies on second launch.

## Important Notes
- **NEVER** push to `--branch development` — the installed APK ignores that channel
- The preview build checks for updates on the `preview` channel only
- No WiFi/local dev server needed — works on mobile data
- Runtime version must match (currently `1.0.0`) — if you change native modules, a new APK build is required
