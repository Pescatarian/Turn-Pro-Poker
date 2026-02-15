# Turn Pro Poker

Professional poker session tracking and bankroll management app.

## Quick Start

### Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
py -3.11 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API docs: http://localhost:8000/docs

### Frontend (Expo React Native)
```bash
cd frontend
npm install
npx expo start --dev-client  # For custom dev client (native modules)
# OR
npx expo start               # For Expo Go (limited features)
```

## Features

- **Session Tracking**: Log buy-ins, cash-outs, game type, stakes, location
- **Bankroll Management**: Track deposits, withdrawals, running balance
- **Statistics**: Hourly rate, win rate, total profit, session history
- **Hand Replayer**: 9-seat poker table, dealer button, bet chips, blind posting, pot calculations with stack restrictions, street progression (preflop→river), community card dealing, undo/redo navigation, action history with street separators, unknown card support, multi-pot display (main + side pots), active player glow indicator, BB option preflop, .txt HH sharing (PokerStars/PT4 format), compact board card picker (2×7 grid), gradient card backgrounds with crisp dark suit colors
- **Persistent Login**: Stays logged in across sessions until explicit logout
- **Privacy Mode**: Hide sensitive information
- **Offline-First**: Works without internet, syncs when connected
- **JWT Authentication**: Secure user accounts

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Mobile** | React Native + Expo |
| **Database (Mobile)** | WatermelonDB (SQLite) |
| **Backend** | FastAPI + SQLAlchemy 2.0 |
| **Database (Server)** | PostgreSQL (prod) / SQLite (dev) |
| **Auth** | JWT + bcrypt |

## Development Builds

For native module support (WatermelonDB SQLite), use EAS Build:

```bash
cd frontend
npx eas login
npx eas build --profile development --platform android
# Install the resulting APK on your device
npx expo start --dev-client
```

## Deployment

### Backend
Deploy to Render.com or Railway:
- Root Directory: `backend`
- Build: `pip install -r requirements.txt`
- Start: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### Frontend
Build for app stores via EAS:
```bash
eas build --platform android  # Play Store
eas build --platform ios      # App Store
```

## Project Structure

```
Turn-Pro-Poker/
├── backend/          # FastAPI server
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   └── routers/
│   └── requirements.txt
├── frontend/         # Expo React Native app
│   ├── app/          # expo-router pages
│   ├── model/        # WatermelonDB models
│   ├── components/   # UI components (incl. replayer/PokerTable.tsx)
│   └── app.json
├── .agent/workflows/ # Dev workflows (safe-edit, deploy, editing-rules)
└── index.html        # Original prototype (includes poker table replayer)
```
