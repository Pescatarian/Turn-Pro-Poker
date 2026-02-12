# Turn Pro Poker - Implementation Plan

> **Status as of Feb 12, 2026**  
> Phase 5 Batch 1 & Batch 2 complete. Dashboard, More page, and Transactions fully built.  
> **Next:** UI polish (stats page filters, loading states, toast system, error boundaries).

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
- **RevenueCat configured** - Products, entitlements, webhook all set
- **Paywall UI redesigned** - Turn Pro logo, styled container, instant loading
- **CSV export** via native share sheet (`services/export.ts`)
- **Session form UX** - native date picker, location dropdown, game type toggle
- **Swipe gestures** on session cards (delete right, edit left)
- **Location management** hook (`hooks/useLocations.ts`)
- **Dashboard filters** - FilterChips (week/month/3mo/year/all + venue)
- **BankrollChart** - multi-series (Won + Net Profit), x-axis toggle, tooltips
- **BankrollModal** - deposit/withdraw forms, navigate to transactions
- **Transactions page** - full CRUD (add/edit/delete), privacy-aware
- **Global Privacy Mode** - `PrivacyContext` used in dashboard, transactions, BankrollModal
- **Passcode Lock** - 4-digit setup, auto-lock on background, verify on resume
- **SessionModalContext** - shared add/edit session modal state
- **More page** - profile card, features menu, settings, premium upgrade banner
- **GlassCard** with BlurView across 7 screens
- **ScreenWrapper** - consistent layout component
- **Theme system** (COLORS, GRADIENTS, FONTS)
- **Hands replayer UI** - 9-seat table, card/suit picker, action buttons/history
- Basic tests (6/11 passing — pre-existing failures)

### ⏳ Blocked (LOW PRIORITY)
- Real purchase testing (needs Google Play Console — deliberately deferred)

### ⏳ Upcoming
- Stats page: wire to global `PrivacyContext` + add filters
- Loading states / skeleton loaders (none exist)
- Toast notification system (36 `Alert.alert` calls to replace)
- Error boundaries (none exist)
- Remaining "coming soon" items (Player Profiles, Locations, Notepad, Calendar, PDF Export)
- iOS build
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

## Current Priority: UI Polish & Feature Completion (Phase 5)

**Dashboard ✅ Done:** Filters, BankrollChart, BankrollModal, privacy toggle, stat cards.

**Next Steps:**
1. Wire Stats page to global `PrivacyContext` (currently local `useState`)
2. Add FilterChips to Stats page (time-range + venue, like dashboard)
3. Implement toast notification system (replace 36 `Alert.alert` calls)
4. Add skeleton loaders for data-fetching screens
5. Add ErrorBoundary wrapper
6. Build out "coming soon" features (Player Profiles, Locations, etc.)

**ETA:** 1-2 weeks

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
| RevenueCat Setup | 3-4 days | ⏳ Blocked (Play Console) |
| **Feature Batch 1** | **2 days** | ✅ **Complete** |
| **Feature Batch 2** | **3 days** | ✅ **Complete** |
| UI Polish | 1-2 weeks | ⏳ Next |
| iOS Build | 2-3 days | 🔜 Soon |
| RevenueCat Testing | 3-4 days | ⏳ LOW PRIORITY |
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
- [x] **RevenueCat SDK configured** (products, entitlements, webhook)
- [x] **Paywall UI redesigned** (logo, instant load, styled containers)
- [ ] Real purchases (pending Play Console)
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
- `frontend/contexts/SubscriptionContext.tsx` - Subscription state ✅
- `frontend/app/paywall.tsx` - Paywall UI with branding ✅
- `frontend/services/export.ts` - CSV export service ✅
- `frontend/hooks/useLocations.ts` - Location management hook ✅
- `frontend/assets/images/turn-pro-logo-transparent.png` - Logo (transparent PNG)
- `frontend/app/(tabs)/` - Main screens ✅ (sessions page with swipe gestures)

**Configuration:**
- `frontend/eas.json` - EAS Build and Update configuration ✅
- `frontend/app.json` - Expo config with EAS Update support ✅
- `frontend/babel.config.js` - Babel configuration ✅

---

## Next 3 Steps

1. **Stats page polish** — wire to global `PrivacyContext` + add `FilterChips`
2. **Toast system** — replace `Alert.alert` calls with non-blocking toasts
3. **Loading states** — skeleton loaders + error boundaries

**For detailed documentation, see:**
- [Next Phase.md](file:///c:/Users/USER/Desktop/Turn-Pro-Poker/Next%20Phase.md)
- [EAS Update Guide](file:///C:/Users/USER/.gemini/antigravity/brain/15fa22a1-7534-4908-bf28-23def5852d9c/eas_update_guide.md)
- [Instant Config Workflow](file:///C:/Users/USER/.gemini/antigravity/brain/15fa22a1-7534-4908-bf28-23def5852d9c/instant_config_workflow.md)
