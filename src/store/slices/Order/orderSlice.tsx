import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { apiGetOrders, apiPlaceOrder, getOrderList } from '@/services/orderService';

const initialState: any = {
  allOrders: [] as any,
  orderDetails: [] as any,
  orderList: [],
  guestUserOrderDetails: null,
  loading: false,
  status: '',
};

export const fetchPlaceOrder = createAsyncThunk('order/add/fetchAddOrders', async ({ data }: { data: any }, { rejectWithValue }) => {
  try {
    const response = await apiPlaceOrder(data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.response.data.message);
  }
});
export const fetchOrderList = createAsyncThunk('order/add/fetchOrderList', async () => {
  try {
    const response = await getOrderList();
    return response.data;
  } catch (error: any) {
    return error.message;
  }
});

export const fetchGetOrdeDetails = createAsyncThunk('order/:id/fetchGetOrdeDetails', async (id: any, { rejectWithValue }) => {
  try {
    const response = await apiGetOrders(id);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const orderSlice = createSlice({
  name: 'order',
  initialState,
  reducers: {
    setGuestUserOrderDetails: (state, action: PayloadAction<any>) => {
      state.orderDetails = action.payload;
      state.guestUserOrderDetails = true;
      state.loading = false;
      state.status = 'fulfilled';
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrderList.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrderList.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.orderList = action.payload?.data;
      })
      .addCase(fetchOrderList.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch products';
      })
      .addCase(fetchPlaceOrder.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPlaceOrder.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.allOrders = action.payload?.data;
      })
      .addCase(fetchPlaceOrder.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch products';
      })
      .addCase(fetchGetOrdeDetails.pending, (state) => {
        state.loading = true;
        state.status = 'pending';
      })
      .addCase(fetchGetOrdeDetails.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.status = 'fulfilled';
        state.orderDetails = action.payload?.data;
      })
      .addCase(fetchGetOrdeDetails.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.status = 'rejected';
        state.error = action.payload || 'Failed to fetch products';
      });
  },
});

export const { setGuestUserOrderDetails } = orderSlice.actions;

export default orderSlice.reducer;
