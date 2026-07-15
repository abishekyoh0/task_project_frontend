import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface TenantState {
  activeTenantId: string | null;
}

const initialState: TenantState = {
  activeTenantId: localStorage.getItem('tenantId'),
};

const tenantSlice = createSlice({
  name: 'tenant',
  initialState,
  reducers: {
    setTenantId: (state, action: PayloadAction<string>) => {
      state.activeTenantId = action.payload;
      localStorage.setItem('tenantId', action.payload);
    },
    clearTenantId: (state) => {
      state.activeTenantId = null;
      localStorage.removeItem('tenantId');
    },
  },
});

export const { setTenantId, clearTenantId } = tenantSlice.actions;
export default tenantSlice.reducer;
