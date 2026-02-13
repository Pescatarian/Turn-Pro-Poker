# Turn Pro Poker - Development Roadmap

> **📍 Current Status:** Phase 5 Batches 1–3 & UI Polish complete. Stats page filters done. All core screens polished.
> **🎯 Next Priority:** Remaining "coming soon" features + Hand replayer + iOS build

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

## Phase 3: RevenueCat & IAP Setup ⏳ **IN PROGRESS**
**Duration:** 3-4 days  
**Status:** SDK integrated, configured, paywall UI redesigned

### RevenueCat Configuration ✅
- [x] RevenueCat SDK integrated
- [x] Created RevenueCat account + configured API keys
- [x] Defined subscription products (Semi-Pro Monthly, Pro Monthly)
- [x] Configured entitlements (Semi-Pro, Pro)
- [x] Added products to default offering
- [x] Backend webhook handler (`/webhooks/revenuecat`) with signature verification
- [x] Configured webhook URL in RevenueCat
- [ ] Configure iOS app (when ready for iOS build)

### Paywall UI Redesign ✅
- [x] Removed 3-second loading delay (instant load)
- [x] Added Turn Pro logo with transparent background in styled container
- [x] Moved tier labels (Free, Semi-Pro, Pro) to top of feature table
- [x] Removed "Current: FREE" badge from header
- [x] Removed unclear "Choose Your Plan" section title
- [x] Packages only display when available from RevenueCat
- [x] Logo container matches features section styling (`#1a1a1a`, rounded corners)

### Testing (LOW PRIORITY — moved to end per user decision)
- [x] Paywall UI accessible and functional
- [x] Products visible in RevenueCat dashboard
- [ ] Real purchase testing (requires Google Play Console — $25 fee)
- [ ] iOS purchase testing (requires App Store Connect)

> ⚠️ **Play Console setup is deliberately LOW PRIORITY.** Do not elevate this.

**Deliverable:** ✅ RevenueCat configured, paywall redesigned. Purchase testing deferred.

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

## Phase 5: UI Polish & Features ⏳ **IN PROGRESS**
**Duration:** 1-2 weeks  
**Can parallelize:** With Phases 3-4

### Batch 1 ✅ COMPLETE
- [x] CSV export via native share sheet (`services/export.ts`)
- [x] Location management UI (dropdown from session history)
- [x] Pull-to-refresh (working with sync)
- [x] Swipe-to-delete/edit (gesture-based on session cards)
- [x] Session form UX (native date picker, location dropdown, game type toggle)

### Batch 2 ✅ COMPLETE
- [x] Dashboard filters: time-range (week/month/3mo/year/all) + venue filtering (`FilterChips`)
- [x] Global privacy mode (`PrivacyContext`) — used in dashboard, transactions, BankrollModal
- [x] BankrollChart: multi-series (Won + Net Profit), x-axis toggle (sessions/hours/hands), tooltips
- [x] BankrollModal: deposit/withdraw forms, view transactions link
- [x] Transactions page: full CRUD (add/edit/delete), privacy-aware
- [x] Passcode Lock: 4-digit setup, auto-lock on app background, verify on resume
- [x] SessionModalContext: shared add/edit session modal state
- [x] More page: profile card, features menu, settings section, premium upgrade banner

### UI Polish (Already Done)
- [x] GlassCard with BlurView (used in dashboard, sessions, coach, passcode, BankrollChart)
- [x] ScreenWrapper component (consistent screen layout)
- [x] Theme system (`constants/theme.ts`) with COLORS, GRADIENTS, FONTS
- [x] Dashboard styling finalized (shadow-halo fix, stat card values 20px/fw600)

### Batch 3: UI Polish ✅ COMPLETE
- [x] Toast notification system (replaced ~25 Alert.alert calls with dismissible toasts)
- [x] Error boundary (class-based, wraps app provider tree)
- [x] Skeleton loaders (dashboard, stats, bankroll screens)
- [x] Privacy mode enhanced (hides chart, grays values, hides trend on dashboard + stats)
- [x] Chart fixes (negative values, zero-line, clean y-axis, toggle repositioned)
- [x] Session modal KeyboardAvoidingView
- [x] Header cleanup (removed user avatar, full-width filter + Get Coach)
- [x] Tab navigator lazy=false (eliminates first-navigation flash)
- [x] Fixed pre-existing Date|null TypeScript errors
- [x] Stats page: time-range + venue filters (FilterChips, PrivacyContext, skeleton loader)

### UI Polish (Remaining)
- [ ] Hand replayer animations (Share/Play buttons show "coming soon")

### More Page — "Coming Soon" Items
- [ ] Player Profiles
- [ ] Locations management page
- [ ] Notepad
- [ ] Calendar view
- [ ] PDF Export

**Deliverable:** Polished UI matching prototype

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

### Infrastructure
- Backend API (auth, sessions, sync endpoints) on Render.com
- WatermelonDB offline data layer with sync
- Android development build (EAS Update support)
- EAS Update configured — instant OTA code updates (~30 sec)
- In-app backend URL configuration (gear icon on login)
- RevenueCat SDK + paywall UI with Turn Pro logo

### Dashboard
- Bankroll hero with privacy toggle (eye icon)
- BankrollChart (multi-series: Won + Net Profit, x-axis toggle: sessions/hours/hands)
- FilterChips (time-range: week/month/3mo/year/all + venue filter)
- BankrollModal (deposit/withdraw + view transactions)
- GlassCard stat rows (3 rows: profit/$/hr/winrate, sessions/hours/avg, tips/expenses)
- Pull-to-refresh with sync

### Sessions
- Session cards with swipe-to-delete/edit gestures
- Session form with native date picker, location dropdown, game type toggle
- Session detail/edit page
- GlassCard styling with BlurView

### More Page
- Profile card with email + plan display
- Transactions page (full CRUD: add/edit/delete)
- Passcode Lock (4-digit, auto-lock on background)
- CSV Export via share sheet
- Premium upgrade banner → paywall
- Sign out with confirmation

### Global Features
- PrivacyContext: global privacy mode (dashboard, transactions, BankrollModal)
- AuthContext, SyncContext, SubscriptionContext, ApiConfigContext
- SessionModalContext: shared add/edit modal state
- ScreenWrapper: consistent layout across screens
- Theme system (COLORS, GRADIENTS, FONTS)

### Hands Tab
- Full replayer UI (9-seat poker table, card picker, suit picker)
- Action buttons (Fold/Check/Call/Bet/Raise)
- Action history pills
- Playback controls (Share, Play, ←/→ navigation)

---

## Key Assets

- **Turn Pro Logo:** `frontend/assets/images/turn-pro-logo-transparent.png` (transparent PNG)
- **Paywall Screen:** `frontend/app/paywall.tsx`
- **Subscription Context:** `frontend/contexts/SubscriptionContext.tsx`
- **Purchases Service:** `frontend/services/purchases.ts`
- **CSV Export Service:** `frontend/services/export.ts`
- **Location Hook:** `frontend/hooks/useLocations.ts`
- **Sessions Page:** `frontend/app/(tabs)/sessions/index.tsx` (swipe gestures + form UX)

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
