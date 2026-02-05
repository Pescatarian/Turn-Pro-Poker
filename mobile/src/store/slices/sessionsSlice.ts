import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Session } from '../../types';

interface SessionsState {
  items: Session[];
  loading: boolean;
  error: string | null;
  pendingSync: Session[]; // Offline-first: sessions waiting to sync
}

const initialState: SessionsState = {
  items: [],
  loading: false,
  error: null,
  pendingSync: [],
};

const sessionsSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {
    setSessions: (state, action: PayloadAction<Session[]>) => {
      state.items = action.payload;
      state.loading = false;
    },
    addSession: (state, action: PayloadAction<Session>) => {
      state.items.unshift(action.payload);
      // Add to pending sync if offline
      state.pendingSync.push(action.payload);
    },
    updateSession: (state, action: PayloadAction<Session>) => {
      const index = state.items.findIndex(s => s.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteSession: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(s => s.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearPendingSync: (state, action: PayloadAction<string[]>) => {
      state.pendingSync = state.pendingSync.filter(
        s => !action.payload.includes(s.id)
      );
    },
  },
});

export const {
  setSessions,
  addSession,
  updateSession,
  deleteSession,
  setLoading,
  setError,
  clearPendingSync,
} = sessionsSlice.actions;

export default sessionsSlice.reducer;