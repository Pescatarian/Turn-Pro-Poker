# Turn Pro Poker - Implementation Plan

> **Status as of Feb 9, 2026**  
> Phase 2 complete. Backend deployed to Render, sync working successfully.  
> **NEW:** Hot-reload workflow and EAS Update configured - instant code updates without rebuilds!

---

## Quick Status

### ✅ Completed
- Backend API (FastAPI + PostgreSQL)
- **Backend deployed to Render** (`https://turn-pro-poker-api.onrender.com`)
- Authentication (JWT)
- WatermelonDB models and sync endpoints
- Sync infrastructure (`SyncContext.tsx`, `SyncIndicator.tsx`)
- All core screens (Dashboard, Sessions, Stats, Bankroll, Hands, Settings)
- Android development build (EAS Build)
- **EAS Update configured** - Over-the-air code updates in ~30 seconds
- **In-app backend configuration** - Change API URL without rebuilds
- **Hot-reload workflow** - Edit code → push update → app updates instantly
- Basic tests (11/11 frontend, 5/5 backend passing)

### 🚧 In Progress
- RevenueCat configuration (Phase 3)

### ⏳ Upcoming
- iOS build
- UI polish (glassmorphism, privacy mode, export features)
- Comprehensive testing
- App Store submission

---

## Architecture

```mermaid
flowchart LR
    Mobile["React Native App<br/>(WatermelonDB)"] <--> Backend["FastAPI Backend<br/>(PostgreSQL)"]
    Mobile <--> RC["RevenueCat"]
    Mobile <--> EAS["EAS Update<br/>(OTA Updates)"]
    Backend <--> RC
    RC <--> Stores["App/Play Store"]
```

**Tech Stack:**
- Mobile: React Native + Expo + WatermelonDB
- Backend: FastAPI + PostgreSQL + JWT
- Payments: RevenueCat
- Hosting: Render.com
- Updates: EAS Update (over-the-air)

---

## Current Priority: RevenueCat Configuration (Phase 3)

**Why:** Sync is complete, hot-reload workflow set up, now need to set up in-app purchases

**Steps:**
1. Create RevenueCat account
2. Configure API keys in app
3. Define subscription products (Free/Premium/Pro)
4. Build paywall screen UI
5. Test with sandbox accounts (iOS + Android)
6. Set up backend webhook handler

**ETA:** 3-4 days

---

## Development Workflow (NEW!)

### Instant Code Updates (30 seconds)
```bash
# Make code changes, then:
cd frontend
npx eas-cli update --branch preview --message "Your changes"
# Close/reopen app → Changes appear!
```

### Change Backend URL (No coding)
- Tap ⚙️ gear icon on login screen
- Select backend (Production/Local/Custom)
- Restart app
- Done!

### When to Rebuild APK
- ❌ **NOT needed for:** Code changes, UI updates, logic changes, API URLs
- ✅ **Only needed for:** New native dependencies, permissions changes, Expo SDK updates

---

## Timeline to Launch

| Phase | Est. Duration | Status |
|-------|--------------|---------|
| Backend Deployment | 2-3 days | ✅ Complete |
| Server Sync | 3-5 days | ✅ Complete |
| **Hot-Reload Setup** | **1 day** | ✅ **Complete** |
| RevenueCat Setup | 3-4 days | ⏳ Next |
| iOS Build | 2-3 days | 🔜 Soon |
| UI Polish | 1-2 weeks | 🔜 Soon |
| Testing | 1 week | 🔜 Soon |
| Store Submission | 1 week | 🔜 Soon |

**Total: 5-7 weeks to launch** (improved with hot-reload workflow!)

---

## Technology Decisions

> [!NOTE]
> **Development Workflow:**
> - ✅ EAS Update for over-the-air updates (COMPLETE)
> - ✅ In-app backend configuration (COMPLETE)
> - ✅ SecureStore for settings persistence (COMPLETE)

> [!IMPORTANT]
> **Technology Decisions:**
> - ✅ WatermelonDB for offline-first (APPROVED - implemented)
> - ✅ RevenueCat for IAP (APPROVED - SDK integrated)
> - ✅ Expo Development Build (APPROVED - Android working)
> - ✅ EAS Update (APPROVED - configured and tested)

> [!WARNING]  
> **Breaking Changes:**
> - ✅ Expo Go replaced with development builds (COMPLETE)
> - ✅ Removed react-native-dotenv (replaced with SecureStore)
> - ⚠️ Requires Xcode for iOS builds (upcoming)

---

## Verification Plan

### Backend Tests
```bash
cd backend && pytest --cov=app
# Current: ~60% | Target: >80%
```

### Frontend Tests
```bash
cd frontend && npm test -- --coverage
# Current: 11/11 passing ✅
```

### Manual Testing
- [x] Offline session creation works
- [x] WatermelonDB queries functional
- [x] Auth flow (register/login) works
- [x] Server sync working with Render
- [x] **EAS Update working** (code updates in ~30 sec)
- [x] **In-app backend switching** works
- [ ] RevenueCat purchases (pending config)
- [ ] iOS build (pending)

---

## Key Files

**Backend:**
- `backend/app/api/v1/endpoints/sync.py` - Sync endpoints ✅
- `backend/app/api/v1/endpoints/auth.py` - Authentication ✅
- `backend/app/api/v1/endpoints/webhooks.py` - RevenueCat handler ⏳

**Frontend:**
- `frontend/model/Session.ts` - WatermelonDB Session model ✅
- `frontend/sync/index.ts` - Sync adapter ✅
- `frontend/services/api.ts` - API client with dynamic URL loading ✅
- `frontend/contexts/ApiConfigContext.tsx` - Backend URL management ✅
- `frontend/components/ApiSettingsModal.tsx` - In-app settings ✅
- `frontend/services/purchases.ts` - RevenueCat wrapper ✅
- `frontend/app/(tabs)/` - Main screens ✅

**Configuration:**
- `frontend/eas.json` - EAS Build and Update configuration ✅
- `frontend/app.json` - Expo config with EAS Update support ✅
- `frontend/babel.config.js` - Babel configuration ✅

---

## Next 3 Steps

1. **Configure RevenueCat** (this week)
2. **Test subscriptions** (next week)  
3. **Build iOS version** (next week)

**For detailed documentation, see:**
- [Next Phase.md](file:///c:/Users/USER/Desktop/Turn-Pro-Poker/Next%20Phase.md)
- [EAS Update Guide](file:///C:/Users/USER/.gemini/antigravity/brain/15fa22a1-7534-4908-bf28-23def5852d9c/eas_update_guide.md)
- [Instant Config Workflow](file:///C:/Users/USER/.gemini/antigravity/brain/15fa22a1-7534-4908-bf28-23def5852d9c/instant_config_workflow.md)
