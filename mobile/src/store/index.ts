import { configureStore } from '@reduxjs/toolkit';
import sessionsReducer from './slices/sessionsSlice';
import authReducer from './slices/authSlice';
import walletsReducer from './slices/walletsSlice';

export const store = configureStore({
  reducer: {
    sessions: sessionsReducer,
    auth: authReducer,
    wallets: walletsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;