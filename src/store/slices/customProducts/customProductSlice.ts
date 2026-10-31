import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import {
  fetchDiamondList,
  fetchSettingList,
  fetchDiamondFilters,
  fetchSettingFilters,
  fetchDiamondById,
  fetchSettingById,
} from '@/services/customProductService';
export interface CustomProductState {
  data: any;
  loading: boolean;
  error: string | null;
  diamondList: {
    count: number;
    rows: any[];
  };
  settingList: {
    count: number;
    rows: any[];
  };
  diamondFilters: any;
  settingFilters: any;
  selectedRingSize: any;
  customShapes: any;
  customCarats: any;
  selectedShapesData: any;
  selectedCaratsData: any;
  selectedDiamondStore: any;
  selectedSettingStore: any;
  selectedSettingSkuData: any;
  selectedSettingRingPrice: any;
  diamondPageNumber: number;
  diamondPageSize: number;
  isSelectedDiamondFilter: boolean;
  selectedDiamondFilters: {
    shapes: string[];
    colors: string[];
    clarity: string[];
    cut: string[];
    minCarat: number;
    maxCarat: number;
    minAmount: number;
    maxAmount: number;
  };
  settingPageNumber: number;
  settingPageSize: number;
  selectedSettingFilters: {
    min_price: number;
    max_price: number;
    jewelryType: string;
    subTypes: any[];
    metal: any[];
    specialTitle: any[];
    shape: any[];
    is_customizable: boolean;
  };
}

const initialState: CustomProductState = {
  data: null,
  loading: false,
  error: null,
  diamondList: {
    count: 0,
    rows: [],
  },
  settingList: {
    count: 0,
    rows: [],
  },
  diamondFilters: {},
  settingFilters: {},
  customShapes: null,
  customCarats: null,
  selectedRingSize: null,
  selectedShapesData: null,
  selectedCaratsData: null,
  selectedDiamondStore: null,
  selectedSettingStore: null,
  selectedSettingSkuData: null,
  selectedSettingRingPrice: null,
  diamondPageNumber: 1,
  diamondPageSize: 50,
  isSelectedDiamondFilter: false,
  selectedDiamondFilters: {
    shapes: [],
    colors: [],
    clarity: [],
    cut: [],
    minCarat: 0,
    maxCarat: 0,
    minAmount: 0,
    maxAmount: 0,
  },
  settingPageNumber: 1,
  settingPageSize: 50,
  selectedSettingFilters: {
    min_price: 0,
    max_price: 0,
    jewelryType: '',
    subTypes: [],
    metal: [],
    specialTitle: [],
    shape: [],
    is_customizable: true,
  },
};

// Async thunk for fetching diamond list
export const fetchDiamonds = createAsyncThunk('customProduct/fetchDiamonds', async ({ data, pageData }: any, { rejectWithValue }) => {
  try {
    const response = await fetchDiamondList(data, pageData);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

// Async thunk for fetching setting list
export const fetchSettings = createAsyncThunk(
  'customProduct/fetchSettings',
  async (
    {
      data,
      page,
      size,
    }: {
      data: any;
      page: number;
      size: number;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetchSettingList(data, page, size);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

// Async thunk for fetching diamond filters
export const fetchDiamondFiltersThunk = createAsyncThunk('customProduct/fetchDiamondFilters', async (data: any, { rejectWithValue }) => {
  try {
    const response = await fetchDiamondFilters(data);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

// Async thunk for fetching setting filters
export const fetchSettingFiltersThunk = createAsyncThunk('customProduct/fetchSettingFilters', async (type: string, { rejectWithValue }) => {
  try {
    const response = await fetchSettingFilters(type);
    return response.data?.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

// Async thunk for fetching a diamond by ID
export const fetchDiamondByIdThunk = createAsyncThunk('customProduct/fetchDiamondById', async (id: string, { rejectWithValue }) => {
  try {
    const response = await fetchDiamondById(id);
    return response.data.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

// Async thunk for fetching a setting by ID
export const fetchSettingByIdThunk = createAsyncThunk('customProduct/fetchSettingById', async (id: string, { rejectWithValue }) => {
  try {
    const response = await fetchSettingById(id);
    return response.data?.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const customProductSlice = createSlice({
  name: 'customProduct',
  initialState,
  reducers: {
    clearCustomProductData: (state) => {
      state.data = null;
      state.error = null;
      state.diamondList = {} as any;
      state.settingList = {} as any;
      state.selectedDiamondStore = null;
      state.selectedSettingStore = null;
    },
    setDiamondFilters: (state, action: PayloadAction<any>) => {
      state.diamondFilters = action.payload;
    },
    setSelectedDiamondStore: (state, action: PayloadAction<any>) => {
      state.selectedDiamondStore = action.payload;
    },
    setSelectedSettingStore: (state, action: PayloadAction<any>) => {
      state.selectedSettingStore = action.payload;
    },
    setSelectedSettingSkuData: (state, action: PayloadAction<any>) => {
      state.selectedSettingSkuData = action.payload;
    },
    setSelectedSettingRingPrice: (state, action: PayloadAction<any>) => {
      state.selectedSettingRingPrice = action.payload;
    },
    setSelectedRingSize: (state, action: PayloadAction<any>) => {
      state.selectedRingSize = action.payload;
    },
    setCustomShapes: (state, action: PayloadAction<any>) => {
      state.customShapes = action.payload;
    },
    setCustomCarats: (state, action: PayloadAction<any>) => {
      state.customCarats = action.payload;
    },
    setSelectedShapesData: (state, action: PayloadAction<any>) => {
      state.selectedShapesData = action.payload;
    },
    setSelectedCaratsData: (state, action: PayloadAction<any>) => {
      state.selectedCaratsData = action.payload;
    },
    setDiamondPageNumber: (state, action: PayloadAction<any>) => {
      state.diamondPageNumber = action.payload;
    },
    setDiamondPageSize: (state, action: PayloadAction<any>) => {
      state.diamondPageSize = action.payload;
    },
    clearSelectedDiamondFilters: (state) => {
      state.selectedDiamondFilters = initialState.selectedDiamondFilters;
    },
    setSelectedDiamondFilters: (state, action: PayloadAction<Partial<CustomProductState['selectedDiamondFilters']>>) => {
      state.isSelectedDiamondFilter = true;
      state.selectedDiamondFilters = {
        ...state.selectedDiamondFilters,
        ...action.payload,
      };
    },
    setIsSelectedDiamondFilter: (state, action: PayloadAction<any>) => {
      state.isSelectedDiamondFilter = action.payload;
    },
    setSettingPageNumber: (state, action: PayloadAction<number>) => {
      state.settingPageNumber = action.payload;
    },
    setSettingPageSize: (state, action: PayloadAction<number>) => {
      state.settingPageSize = action.payload;
    },
    setSelectedSettingFilters: (state, action: PayloadAction<Partial<CustomProductState['selectedSettingFilters']>>) => {
      state.selectedSettingFilters = {
        ...state.selectedSettingFilters,
        ...action.payload,
      };
    },
    resetSelectedSettingFilters: (state) => {
      state.selectedSettingFilters = initialState.selectedSettingFilters;
    },
    clearSettingFilters: (state) => {
      state.settingFilters = {};
    },
  },
  extraReducers: (builder) => {
    builder
      //   .addCase(fetchCustomProduct.pending, (state) => {
      //     state.loading = true;
      //     state.error = null;
      //   })
      //   .addCase(fetchCustomProduct.fulfilled, (state, action: PayloadAction<any>) => {
      //     state.loading = false;
      //     state.data = action.payload;
      //   })
      //   .addCase(fetchCustomProduct.rejected, (state, action: PayloadAction<any>) => {
      //     state.loading = false;
      //     state.error = action.payload;
      //   })
      .addCase(fetchDiamonds.pending, (state) => {
        state.loading = true;
        // state.diamondList = action.payload;
      })
      .addCase(fetchDiamonds.fulfilled, (state, action: PayloadAction<any>) => {
        state.diamondList = action.payload;
        state.loading = false;
      })
      .addCase(fetchDiamonds.rejected, (state, action: PayloadAction<any>) => {
        state.diamondList = action.payload;
        state.loading = false;
      })
      .addCase(fetchSettings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSettings.fulfilled, (state, action: PayloadAction<any>) => {
        const data: any = action.payload.data?.rows;
        state.settingList.rows = state.settingPageNumber === 1 ? data : [...state.settingList.rows, ...data];
        state.settingList.count = action.payload?.data?.count;
        state.loading = false;
      })
      .addCase(fetchSettings.rejected, (state, action: PayloadAction<any>) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(fetchDiamondFiltersThunk.fulfilled, (state, action: PayloadAction<any>) => {
        state.diamondFilters = action.payload;
      })
      .addCase(fetchSettingFiltersThunk.fulfilled, (state, action: PayloadAction<any>) => {
        state.settingFilters = action.payload;
      })
      .addCase(fetchDiamondByIdThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchDiamondByIdThunk.fulfilled, (state, action: PayloadAction<any>) => {
        state.selectedDiamondStore = action.payload;
        state.loading = false;
      })
      .addCase(fetchDiamondByIdThunk.rejected, (state, action: PayloadAction<any>) => {
        state.error = action.payload;
        state.loading = false;
      })
      .addCase(fetchSettingByIdThunk.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSettingByIdThunk.fulfilled, (state, action: PayloadAction<any>) => {
        state.selectedSettingStore = action.payload;
        state.loading = false;
      })
      .addCase(fetchSettingByIdThunk.rejected, (state, action: PayloadAction<any>) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export const {
  clearCustomProductData,
  setSelectedDiamondStore,
  setSelectedSettingStore,
  setSelectedRingSize,
  setSelectedShapesData,
  setSelectedCaratsData,
  setCustomShapes,
  setCustomCarats,
  setDiamondFilters,
  setSelectedSettingSkuData,
  setSelectedSettingRingPrice,
  setDiamondPageSize,
  setDiamondPageNumber,
  clearSelectedDiamondFilters,
  setSelectedDiamondFilters,
  setIsSelectedDiamondFilter,
  setSettingPageNumber,
  setSettingPageSize,
  setSelectedSettingFilters,
  resetSelectedSettingFilters,
  clearSettingFilters,
} = customProductSlice.actions;
export default customProductSlice.reducer;
