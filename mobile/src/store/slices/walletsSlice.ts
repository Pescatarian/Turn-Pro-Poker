import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Wallet } from '../../types';

interface WalletsState {
  items: Wallet[];
  activeWalletId: string | null;
  loading: boolean;
}

const initialState: WalletsState = {
  items: [],
  activeWalletId: null,
  loading: false,
};

const walletsSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {
    setWallets: (state, action: PayloadAction<Wallet[]>) => {
      state.items = action.payload;
      if (action.payload.length > 0 && !state.activeWalletId) {
        state.activeWalletId = action.payload[0].id;
      }
    },
    setActiveWallet: (state, action: PayloadAction<string>) => {
      state.activeWalletId = action.payload;
    },
    updateWalletBalance: (state, action: PayloadAction<{ id: string; balanceCents: number }>) => {
      const wallet = state.items.find(w => w.id === action.payload.id);
      if (wallet) {
        wallet.balanceCents = action.payload.balanceCents;
      }
    },
  },
});

export const { setWallets, setActiveWallet, updateWalletBalance } = walletsSlice.actions;
export default walletsSlice.reducer;