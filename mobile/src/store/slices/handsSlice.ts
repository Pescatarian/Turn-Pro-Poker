import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Hand } from '../../types';

interface HandsState {
  items: Hand[];
  loading: boolean;
  error: string | null;
}

const initialState: HandsState = {
  items: [],
  loading: false,
  error: null,
};

const handsSlice = createSlice({
  name: 'hands',
  initialState,
  reducers: {
    setHands: (state, action: PayloadAction<Hand[]>) => {
      state.items = action.payload;
      state.loading = false;
    },
    addHand: (state, action: PayloadAction<Hand>) => {
      state.items.unshift(action.payload);
    },
    updateHand: (state, action: PayloadAction<Hand>) => {
      const index = state.items.findIndex(h => h.id === action.payload.id);
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    deleteHand: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(h => h.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setHands,
  addHand,
  updateHand,
  deleteHand,
  setLoading,
  setError,
} = handsSlice.actions;

export default handsSlice.reducer;