# Turn Pro Poker - Development Roadmap

> **📍 Current Status:** Phase 2.5 complete! Sync working. Hot-reload workflow configured. EAS Update ready.  
> **🎯 Next Priority:** Phase 3: Configure RevenueCat → iOS Build → UI Polish

---

## Phase 1: Backend Deployment ✅ **COMPLETE**
**Duration:** 2-3 days  
**Completed:** Feb 8, 2026

### Tasks
- [x] Deploy to Render.com
- [x] Configure PostgreSQL managed database
- [x] Set environment variables (JWT_SECRET, DATABASE_URL, CORS_ORIGINS)
- [x] Test `/health` endpoint
- [x] Update mobile `services/api.ts` with production URL
- [x] Verify auth endpoints from mobile app

**Deliverable:** ✅ Live backend at `https://turn-pro-poker-api.onrender.com`

---

## Phase 2: Server Sync Finalization ✅ **COMPLETE**
**Duration:** 3-5 days  
**Completed:** Feb 9, 2026

### Tasks
- [x] Backend sync endpoints created (`/sync/pull`, `/sync/push`)
- [x] Implement WatermelonDB sync adapter (`frontend/sync/index.ts`)
- [x] Add background sync with network detection (`SyncContext.tsx`)
- [x] Add sync status indicator in UI (`SyncIndicator.tsx`)
- [x] **FIXED:** NetInfo native module (rebuilt development client)
- [x] **FIXED:** Schema migration version mismatch
- [x] Test offline → online sync flow
- [x] Verified sync working with Render backend

**Verification:**
- [x] Pull-to-refresh triggers sync
- [x] Sync indicator shows "Synced" status
- [x] Data syncs between app and backend

**Deliverable:** ✅ Offline-first sync working reliably

---

## Phase 2.5: Hot-Reload Workflow & EAS Update ✅ **COMPLETE**
**Duration:** 1 day  
**Completed:** Feb 9, 2026

### Tasks
- [x] Configured EAS Update for over-the-air updates
- [x] Built preview APK with update support
- [x] Implemented in-app backend URL configuration
- [x] Added gear icon (⚙️) on login screen for settings
- [x] Created `ApiConfigContext` for URL management
- [x] Created `ApiSettingsModal` with preset + custom URLs
- [x] Switched from AsyncStorage to SecureStore
- [x] Removed react-native-dotenv dependency
- [x] Added detailed error logging for debugging
- [x] Tested instant updates (working in ~30 sec)

**Features:**
- ⚙️ Tap gear icon → change backend URL instantly
- 🚀 Push code updates without rebuilding APK
- 🌐 Works from any WiFi (cloud backend)
- 📱 One APK receives all future updates

**Deliverable:** ✅ Development workflow optimized - no more 15-minute rebuilds!

---

## Phase 3: RevenueCat & IAP Setup ⏳ **← START HERE**
**Duration:** 3-4 days  
**Status:** SDK integrated, needs configuration

### Tasks
- [x] RevenueCat SDK integrated
- [ ] Create RevenueCat account + configure API keys
- [ ] Define subscription products (Free/Premium/Pro)
- [ ] Build paywall screen UI
- [ ] Implement entitlement checks
- [ ] Backend webhook handler (`/webhooks/revenuecat`)
- [ ] Test with sandbox accounts (iOS + Android)

**Deliverable:** ✅ Working subscriptions, no errors

---

## Phase 4: iOS Build 🔜
**Duration:** 2-3 days  
**Can start:** Anytime (Android already working)

### Tasks
- [ ] Configure iOS bundle ID in `app.json`
- [ ] Run `eas build --platform ios --profile preview`
- [ ] Install via TestFlight
- [ ] Test all features on iOS
- [ ] Fix platform-specific issues

**Deliverable:** ✅ App works on iOS + Android

---

## Phase 5: UI Polish & Features 🔜
**Duration:** 1-2 weeks  
**Can parallelize:** With Phases 3-4

### UI Polish
- [ ] Glassmorphism effects (`expo-blur`)
- [ ] Original prototype colors/gradients
- [ ] Privacy mode toggle
- [ ] Loading states + error handling
- [ ] Toast notifications

### Missing Features
- [ ] CSV/PDF export
- [ ] Location management UI
- [ ] Hand replayer animations
- [x] Pull-to-refresh (working with sync)
- [ ] Swipe-to-delete

**Deliverable:** ✅ Polished UI matching prototype

---

## Phase 6: Testing & QA 🔜
**Duration:** 1 week  
**Timeline:** Continuous + dedicated week before launch

### Automated Tests
- [ ] Increase backend coverage to >80%
- [ ] Frontend component tests
- [ ] E2E tests for critical flows

### Manual Testing
- [x] Offline functionality verified
- [ ] Performance benchmarks (app launch <3s, 60fps)
- [ ] Cross-platform consistency
- [ ] Memory leak checks

**Deliverable:** ✅ Stable, well-tested app

---

## Phase 7: App Store Submission 🔜
**Duration:** 1 week  
**Depends on:** All phases complete

### Checklist
- [ ] App icon (1024x1024)
- [ ] Screenshots (6+ per platform)
- [ ] App descriptions + keywords
- [ ] Privacy policy hosted
- [ ] Compliance checks (App Store + Play Store)
- [ ] Submit for review
- [ ] Respond to feedback

**Deliverable:** 🎉 **Apps live!**

---

## Timeline Overview

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1-2 | Phases 1-2.5 | ✅ Backend live, sync working, hot-reload configured |
| 3 | Phase 3 | IAP configured |
| 4 | Phases 4-5 | iOS build, UI polish |
| 5 | Phase 6 | Testing & bug fixes |
| 6 | Phase 7 | Store submission |

**Total to Launch:** 5-7 weeks (improved with hot-reload workflow!)

---

## What's Already Complete ✅

- Backend API (auth, sessions, sync endpoints)
- Frontend app (all core screens)
- WatermelonDB offline data layer
- Android development build (with EAS Update support)
- **EAS Update configured** - instant code updates
- **In-app backend configuration** - no rebuilds for URL changes
- **Hot-reload development workflow** - 30-second updates
- RevenueCat SDK integration
- Basic test suites (11/11 passing)

---

## Development Workflow (NEW!)

### Push Code Updates (30 seconds)
```bash
cd frontend
npx eas-cli update --branch preview --message "Your changes"
# App auto-updates on next launch!
```

### Change Backend URL (2 taps)
1. Tap ⚙️ gear icon
2. Select backend
3. Restart app

### When to Rebuild
- ❌ Code changes → Use `eas update`
- ❌ UI changes → Use `eas update`
- ❌ API URL changes → Use gear icon
- ✅ New native packages → Use `eas build`

---

## Documentation

**For detailed guides, see:**
- **Implementation Plan:** [implementation-plan.md](file:///c:/Users/USER/Desktop/Turn-Pro-Poker/implementation-plan.md)
- **EAS Update Guide:** [eas_update_guide.md](file:///C:/Users/USER/.gemini/antigravity/brain/15fa22a1-7534-4908-bf28-23def5852d9c/eas_update_guide.md)
- **Hot-Reload Workflow:** [instant_config_workflow.md](file:///C:/Users/USER/.gemini/antigravity/brain/15fa22a1-7534-4908-bf28-23def5852d9c/instant_config_workflow.md)
- **Local Dev Setup:** [local_dev_setup.md](file:///C:/Users/USER/.gemini/antigravity/brain/15fa22a1-7534-4908-bf28-23def5852d9c/local_dev_setup.md)
