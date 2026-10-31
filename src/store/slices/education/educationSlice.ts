import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { apiGetEducationByTitle, apiGetEducationFilter, apiGetEducationList } from '../../../services/educationService';

const initialState: any = {
  educationDetails: {},
  educationFilter: null,
  educationSelectedCategory: null,
  educationSelectedFilter: 'all',
  educationCounts: 0,
  educationList: [],
  educationPage: 1,
  educationPrevPage: 1,
  loading: false,
};

export const fetchEducationFilter = createAsyncThunk('education/fetchEducationFilter', async () => {
  try {
    const response = await apiGetEducationFilter();

    return response.data;
  } catch (error) {
    return error;
  }
});
export const fetchEducationList = createAsyncThunk('education/fetchEducationList', async (data: any = null) => {
  try {
    const response = await apiGetEducationList(data);

    return response.data;
  } catch (error) {
    return error;
  }
});
export const fetchEducationDetails = createAsyncThunk('education/fetchEducationDetails', async (slug: string) => {
  try {
    const response = await apiGetEducationByTitle(slug);

    return response.data;
  } catch (error) {
    return error;
  }
});

const educationSlice = createSlice({
  name: 'education',
  initialState,
  reducers: {
    // clearCartProducts: (state) => {
    //   state.cartProducts = [];
    //   state.productCounts = 0;
    // },
    setEducationPage: (state, action: PayloadAction<any>) => {
      state.educationPage = action.payload;
    },
    setEducationPrevPage: (state, action: PayloadAction<any>) => {
      state.educationPrevPage = action.payload;
    },
    setEducationSelectedCategory: (state, action: PayloadAction<any>) => {
      state.educationSelectedCategory = action.payload;
    },
    setEducationSelectedFilter: (state, action: PayloadAction<any>) => {
      state.educationSelectedFilter = action.payload;
    },
    clearEducationDetails: (state) => {
      state.educationDetails = {};
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEducationFilter.pending, (state) => {
        state.loading = true;
        state.educationFilter = [];
      })
      .addCase(fetchEducationFilter.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.educationFilter = action.payload.data;
      })
      .addCase(fetchEducationFilter.rejected, (state) => {
        state.loading = false;
        state.educationFilter = [];
      })
      .addCase(fetchEducationList.pending, (state) => {
        state.loading = true;
        state.educationList = [];
        state.educationCounts = 0;
      })
      .addCase(fetchEducationList.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // console.log(action.payload.data.count, 'count');

        state.educationCounts = action.payload.data.count;
        state.educationList = action.payload.data.rows;
      })
      .addCase(fetchEducationList.rejected, (state) => {
        state.loading = false;
        state.educationCounts = 0;

        state.educationList = [];
      })
      .addCase(fetchEducationDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchEducationDetails.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.educationDetails = action.payload.data;
      })
      .addCase(fetchEducationDetails.rejected, (state) => {
        state.loading = false;
      });
  },
});

// Export actions to be used in components
export const {
  setEducationSelectedCategory,
  setEducationSelectedFilter,
  clearEducationDetails,
  setEducationPage,
  setEducationPrevPage,
  /* Add any additional actions if needed */
} = educationSlice.actions;

export default educationSlice.reducer;
