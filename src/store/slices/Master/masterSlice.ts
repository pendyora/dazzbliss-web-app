import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
  apiFetchMasterData,
  apiGetHeaderData,
  apiGetRingData,
  GetFastDeliveryDay,
  GetFetchCurrencyCountry,
  apiGetDiamondCircleList,
} from '@/services/masterService'; // Assume this service exists
export interface MasterState {
  data: any[];
  headerData: any;
  megaHeaderData: any;
  loading: boolean;
  error: string | null;
  projectSetting: any;
  currencyList: any[];
  ringSizePriceList: any[];
  gemStoneData: any[];
  appraisalData: any;
  warrantyData: any;
  engraving: any;
}

const initialState: MasterState = {
  data: [] as any,
  headerData: {},
  megaHeaderData: [],
  loading: false,
  error: null,
  currencyList: [],
  ringSizePriceList: [],
  projectSetting: { fastDeliveryDay: {} },
  gemStoneData: [],
  appraisalData: {},
  warrantyData: {},
  engraving: {},
};

// Async thunk for fetching master data
export const fetchMasterData = createAsyncThunk('master/fetchMasterData', async (_, { rejectWithValue }) => {
  try {
    const response = await apiFetchMasterData();
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});
export const otherPriceData = createAsyncThunk('master/otherPriceData', async (type: string, { rejectWithValue }) => {
  try {
    const response: any = await GetFastDeliveryDay(type);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});
export const getFastDeliveryDay = createAsyncThunk('master/getFastDeliveryDay', async (type: string, { rejectWithValue }) => {
  try {
    const response: any = await GetFastDeliveryDay(type);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});
export const getEngraving = createAsyncThunk('master/getEngraving', async (type: string, { rejectWithValue }) => {
  try {
    const response: any = await GetFastDeliveryDay(type);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});
export const fetchRingSizePriceList = createAsyncThunk('master/fetchRingSizePriceList', async (_, { rejectWithValue }) => {
  try {
    const response: any = await apiGetRingData();

    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});
export const fetchCurrencyCountry = createAsyncThunk('master/fetchCurrencyCountry', async (_, { rejectWithValue }) => {
  try {
    const response: any = await GetFetchCurrencyCountry();

    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const fetchHeaderData = createAsyncThunk('master/fetchHeaderData', async (_, { rejectWithValue }) => {
  try {
    const response = await apiGetHeaderData();
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});
export const fetchGemStoneCircle = createAsyncThunk('master/fetchGemStoneCircle', async (_, { rejectWithValue }) => {
  try {
    const response = await apiGetDiamondCircleList();
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const masterSlice = createSlice({
  name: 'master',
  initialState,
  reducers: {
    setMegaHeaderData: (state, action: PayloadAction<any>) => {
      state.megaHeaderData = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMasterData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchMasterData.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(fetchMasterData.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch master data';
      })
      .addCase(otherPriceData.pending, (state) => {
        state.loading = true;
      })
      .addCase(otherPriceData.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        const payload = action.payload || [];
        const appraisalItem = payload?.data?.find((item: any) => item.type === 'appraisal');
        const warrantyItem = payload?.data?.find((item: any) => item.type === 'warranty');
        state.appraisalData = appraisalItem?.data || null;
        state.warrantyData = warrantyItem?.data || null;
      })
      .addCase(otherPriceData.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.appraisalData = {};
        state.warrantyData = {};
        state.error = action.payload || 'Failed to fetch master data';
      })
      .addCase(fetchHeaderData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHeaderData.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.headerData = action.payload;
      })
      .addCase(fetchHeaderData.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch master data';
      })
      .addCase(getFastDeliveryDay.pending, (state) => {
        state.loading = true;
        state.projectSetting.fastDeliveryDay = {};
      })
      .addCase(getFastDeliveryDay.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.projectSetting.fastDeliveryDay = action.payload;
      })
      .addCase(getFastDeliveryDay.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.projectSetting.fastDeliveryDay = {};
        state.error = action.payload || 'Failed to fetch master data';
      })
      .addCase(getEngraving.pending, (state) => {
        state.loading = true;
        state.projectSetting.fastDeliveryDay = {};
      })
      .addCase(getEngraving.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.engraving = action.payload;
      })
      .addCase(getEngraving.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.engraving = {};
        state.error = action.payload || 'Failed to fetch master data';
      })
      .addCase(fetchCurrencyCountry.pending, (state) => {
        state.loading = true;
        state.currencyList = [];
      })
      .addCase(fetchCurrencyCountry.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.currencyList = action.payload;
        const activeCurrency = action.payload?.filter((item: any) => item?.is_active === true);
        const prevSymbol = localStorage.getItem('currencySymbol');
        const prevIndex = activeCurrency?.findIndex((el: any) => el.currency_symbol == prevSymbol);
        const currencySymbol = activeCurrency?.[prevIndex > 0 ? prevIndex : 0].currency_symbol;
        localStorage.setItem('currencySymbol', currencySymbol);
      })
      .addCase(fetchCurrencyCountry.rejected, (state) => {
        state.loading = false;
        state.currencyList = [];
      })
      .addCase(fetchRingSizePriceList.pending, (state) => {
        state.loading = true;
        state.ringSizePriceList = [];
      })
      .addCase(fetchRingSizePriceList.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.ringSizePriceList = action.payload;
      })
      .addCase(fetchRingSizePriceList.rejected, (state) => {
        state.loading = false;
        state.ringSizePriceList = [];
      })
      .addCase(fetchGemStoneCircle.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGemStoneCircle.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.gemStoneData = action.payload;
      })
      .addCase(fetchGemStoneCircle.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch gemstone circle data';
      });
  },
});

export const { setMegaHeaderData } = masterSlice.actions;

export default masterSlice.reducer;
