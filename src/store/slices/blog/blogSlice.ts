import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { apiGetBlogByTitle, apiGetBlogFeaturedViews, apiGetBlogFilter, apiGetBlogList, apiGetBlogMapping } from '@/services/blogService';

interface BlogState {
  blogDetails: any;
  blogFilter: any;
  blogSelectedCategory: any;
  blogSelectedFilter: string;
  blogCounts: number;
  blogList: any[];
  blogPage: number;
  blogPrevPage: number;
  blogFeaturedViews: any;
  loading: boolean;
  pageIndex: number;
  pageSize: number;
  categoryMapping: Array<{
    id: number;
    category_name: string;
    category_link: string;
    sequence: number;
    createdAt: string;
    updatedAt: string;
  }>;
}

const initialState: BlogState = {
  blogDetails: {},
  blogFilter: null,
  blogSelectedCategory: null,
  blogSelectedFilter: 'all',
  blogCounts: 0,
  blogList: [],
  blogPage: 1,
  blogPrevPage: 1,
  blogFeaturedViews: {},
  loading: false,
  pageIndex: 1,
  pageSize: 15,
  categoryMapping: [],
};

export const fetchBlogFilter = createAsyncThunk('blog/fetchBlogFilter', async () => {
  try {
    const response = await apiGetBlogFilter();

    return response.data;
  } catch (error) {
    return error;
  }
});
export const fetchBlogList = createAsyncThunk('blog/fetchBlogList', async (data: any = null) => {
  try {
    const response = await apiGetBlogList(data);

    return response.data;
  } catch (error) {
    return error;
  }
});
export const fetchBlogDetails = createAsyncThunk('blog/fetchBlogDetails', async (slug: string) => {
  try {
    const response = await apiGetBlogByTitle(slug);

    return response.data;
  } catch (error) {
    return error;
  }
});
export const fetchFeaturedViews = createAsyncThunk('blog/fetchFeaturedViews', async () => {
  try {
    const response = await apiGetBlogFeaturedViews();
    return response.data;
  } catch (error) {
    return error;
  }
});
export const fetchBlogMapping = createAsyncThunk('blog/fetchBlogMapping', async () => {
  try {
    const response = await apiGetBlogMapping();
    return response.data;
  } catch (error) {
    return error;
  }
});

const blogSlice = createSlice({
  name: 'blog',
  initialState,
  reducers: {
    // clearCartProducts: (state) => {
    //   state.cartProducts = [];
    //   state.productCounts = 0;
    // },
    setBlogSelectedCategory: (state, action: PayloadAction<any>) => {
      state.blogSelectedCategory = action.payload;
    },
    setBlogPage: (state, action: PayloadAction<any>) => {
      state.blogPage = action.payload;
    },
    setPrevBlogPage: (state, action: PayloadAction<any>) => {
      state.blogPrevPage = action.payload;
    },
    setBlogSelectedFilter: (state, action: PayloadAction<any>) => {
      state.blogSelectedFilter = action.payload;
    },
    clearBlogDetails: (state) => {
      state.blogDetails = {};
    },
    setPageIndex(state, action) {
      state.pageIndex = action.payload;
    },
    setPageSize(state, action) {
      state.pageSize = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBlogFilter.pending, (state) => {
        state.loading = true;
        state.blogFilter = [];
      })
      .addCase(fetchBlogFilter.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.blogFilter = action.payload.data;
      })
      .addCase(fetchBlogFilter.rejected, (state) => {
        state.loading = false;
        state.blogFilter = [];
      })
      .addCase(fetchBlogList.pending, (state) => {
        state.loading = true;
        state.blogList = [];
      })
      .addCase(fetchBlogList.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.blogCounts = action.payload.data.count;
        state.blogList = action.payload.data.rows;
      })
      .addCase(fetchBlogList.rejected, (state) => {
        state.loading = false;
        state.blogCounts = 0;
        state.blogList = [];
      })
      .addCase(fetchBlogDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBlogDetails.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.blogDetails = action.payload.data;
      })
      .addCase(fetchBlogDetails.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchFeaturedViews.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchFeaturedViews.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.blogFeaturedViews = action.payload.data;
      })
      .addCase(fetchFeaturedViews.rejected, (state) => {
        state.loading = false;
        state.blogFeaturedViews = {};
      })
      .addCase(fetchBlogMapping.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchBlogMapping.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.categoryMapping = action.payload.data;
      })
      .addCase(fetchBlogMapping.rejected, (state) => {
        state.loading = false;
        state.categoryMapping = [];
      });
  },
});

// Export actions to be used in components
export const {
  setBlogSelectedCategory,
  setBlogSelectedFilter,
  clearBlogDetails,
  setBlogPage,
  setPrevBlogPage,
  setPageIndex,
  setPageSize,
  /* Add any additional actions if needed */
} = blogSlice.actions;

export default blogSlice.reducer;
