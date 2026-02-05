import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Transaction } from '../../types';

interface TransactionsState {
  items: Transaction[];
  loading: boolean;
  error: string | null;
}

const initialState: TransactionsState = {
  items: [],
  loading: false,
  error: null,
};

const transactionsSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    setTransactions: (state, action: PayloadAction<Transaction[]>) => {
      state.items = action.payload;
      state.loading = false;
    },
    addTransaction: (state, action: PayloadAction<Transaction>) => {
      state.items.unshift(action.payload);
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
  setTransactions,
  addTransaction,
  setLoading,
  setError,
} = transactionsSlice.actions;

export default transactionsSlice.reducer;