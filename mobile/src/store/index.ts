import { configureStore } from '@reduxjs/toolkit';
import sessionsReducer from './slices/sessionsSlice';
import authReducer from './slices/authSlice';
import walletsReducer from './slices/walletsSlice';
import handsReducer from './slices/handsSlice';
import transactionsReducer from './slices/transactionsSlice';

export const store = configureStore({
  reducer: {
    sessions: sessionsReducer,
    auth: authReducer,
    wallets: walletsReducer,
    hands: handsReducer,
    transactions: transactionsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;