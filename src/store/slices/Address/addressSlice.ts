/* eslint-disable no-unsafe-optional-chaining */
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { apiAddAddress, apiEditAddress, apiGetCities, apiGetCountries, apiGetStates } from '@/services/addressService';

const initialState: any = {
  deliveryAddress: null,
  billingAddress: null,
  countries: [],
  states: [],
  // Keyed by country id so Billing and Delivery (and out-of-order responses) can't clobber each other's list.
  statesByCountry: {},
  cities: [],
  loading: false,
};

export const fetchAddDeliveryAddress = createAsyncThunk(
  'user/address/add/fetchAddDeliveryAddress',
  async ({ data }: { data: any }, { rejectWithValue }) => {
    try {
      const response = await apiAddAddress(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchEditDeliveryAddress = createAsyncThunk(
  'user/address/update/:id/fetchEditDeliveryAddress',
  async ({ id, data }: { data: any; id: string }, { rejectWithValue }) => {
    try {
      const response = await apiEditAddress(id, data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchAddBillingAddress = createAsyncThunk(
  'user/address/add/fetchAddBillingAddress',
  async ({ data }: { data: any }, { rejectWithValue }) => {
    try {
      const response = await apiAddAddress(data);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);
export const fetchEditBillingAddress = createAsyncThunk(
  'user/address/update/:id/fetchEditBillingAddress',
  async ({ id, data }: { data: any; id: string }, { rejectWithValue }) => {
    try {
      const response = await apiEditAddress(id, data);
      // I have to create this object because of we are handling some changes based on status code.
      return response?.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchCountries = createAsyncThunk('getCountry/fetchCountries', async (_, { rejectWithValue }) => {
  try {
    const response = await apiGetCountries();
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const fetchStates = createAsyncThunk('getState/fetchStates', async (countryId: string, { rejectWithValue }) => {
  try {
    const response = await apiGetStates(countryId);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const fetchCities = createAsyncThunk('getCity/fetchCities', async (stateId: string, { rejectWithValue }) => {
  try {
    const response = await apiGetCities(stateId);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    setBillingAddress: (state, action) => {
      state.billingAddress = action.payload;
    },
    setDeliveryAddress: (state, action) => {
      state.deliveryAddress = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddDeliveryAddress.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAddDeliveryAddress.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.deliveryAddress = action.payload.data;
      })
      .addCase(fetchAddDeliveryAddress.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch Countries';
      })
      .addCase(fetchEditDeliveryAddress.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEditDeliveryAddress.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.deliveryAddress = action.payload;
      })
      .addCase(fetchEditDeliveryAddress.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch Countries';
      })
      .addCase(fetchAddBillingAddress.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAddBillingAddress.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.billingAddress = action.payload?.data;
      })
      .addCase(fetchAddBillingAddress.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch Countries';
      })
      .addCase(fetchEditBillingAddress.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEditBillingAddress.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.billingAddress = action.payload;
      })
      .addCase(fetchEditBillingAddress.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch Countries';
      })
      .addCase(fetchCountries.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCountries.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.countries = action.payload.data?.rows ?? action.payload?.data ?? action.payload;
      })
      .addCase(fetchCountries.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch Countries';
      })
      .addCase(fetchStates.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchStates.fulfilled, (state, action) => {
        state.loading = false;
        state.states = action.payload.data?.rows ?? action.payload?.data ?? action.payload;
        state.statesByCountry[String(action.meta.arg)] = state.states;
      })
      .addCase(fetchStates.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch States';
      })
      .addCase(fetchCities.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCities.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.cities = action.payload.data?.rows ?? action.payload?.data ?? action.payload;
      })
      .addCase(fetchCities.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch Cities';
      });
  },
});

export const { setBillingAddress, setDeliveryAddress } = addressSlice?.actions;
export default addressSlice.reducer;
