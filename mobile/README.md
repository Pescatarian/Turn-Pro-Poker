# Turn Pro Poker - Mobile App

React Native mobile app for iOS and Android.

## Setup

```bash
cd mobile
npm install
```

## Development

```bash
# Start Expo dev server
npm start

# iOS
npm run ios

# Android
npm run android
```

## Architecture

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation
- **API**: Axios with secure token storage

## Offline-First

Sessions are saved locally first with client-generated UUIDs. Background sync pushes to server when online.

## Monetary Values

All money stored as integers (cents) to avoid floating-point issues:
- `buyinCents: 50000` = $500.00
- `cashoutCents: 75000` = $750.00

## Bundle Identifiers

- iOS: `com.turnpropoker.app`
- Android: `com.turnpropoker.app`
