import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import { getJewelrySearch } from '@/services/productService';

const initialState: any = {
  searchList: [] as any,
  loading: false,
  count: 0,
  query: '',
};

export const fetchSearchData = createAsyncThunk('searchProduct/fetchSearchData', async (data: string, { rejectWithValue }) => {
  try {
    const response: any = await getJewelrySearch(data);
    return response.data?.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const searchProductSlice = createSlice({
  name: 'searchProduct',
  initialState,
  reducers: {
    setSearchList: (state, action: PayloadAction<any>) => {
      state.searchList = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<any>) => {
      state.query = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSearchData.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSearchData.fulfilled, async (state, action: PayloadAction<any>) => {
        // state.searchList = action.payload?.data?.rows;
        // const newData = console.log(newData, 'newData');
        state.searchList = await action.payload?.rows?.map((item: any) => {
          const carat_image = item?.jewelryDetails?.[0]?.carat_images || [];
          const jewelryTypeName = item?.jewelrySubType?.parentDetails?.name;
          const jewelryType = jewelryTypeName?.toLowerCase()?.replace(' ', '-');
          const jewelryDetails = item?.jewelryDetails?.[0];
          return {
            estimated_delivery_days: item?.estimated_delivery_days,
            // productVariation: item?.image_folder_info.length,
            productImage: carat_image[0] ? `${carat_image[0]}` : '/images/no_images.svg',
            productHoverImage: carat_image[1] ? `${carat_image[1]}` : '/images/no_images.svg',
            is_customizable: item?.is_customizable,
            productName: item?.fullTitle,
            productPrice: Math.ceil(item?.jewelryDetails?.[0]?.selling_price),
            variation_to_show: item?.variation_to_show,
            variation_details: item?.variation_details,
            jewelryDetails,
            jewelryTypeData: jewelryType,
            // slug: `${jewelryType}/${item?.slug}`,
            slug: item?.is_customizable ? item?.jewelryDetails?.[0]?.sku_slug : `${jewelryType}/premade?slug=${item.jewelryDetails?.[0]?.sku_slug}`,
            sku_master_id: item?.jewelryDetails?.[0]?.id,
            jewelry_id: item?.jewelryDetails?.[0]?.jewelry_id,
            jewelry_type: item?.jewelrySubType?.parent_code,
            isWishlist: item?.jewelryDetails?.[0]?.wishlist_id,
            discount_type: item?.jewelryDetails?.[0]?.discount_type,
            discount_value: item?.jewelryDetails?.[0]?.discount_value == 0 ? null : item?.jewelryDetails?.[0]?.discount_value,
            discounted_price: item?.jewelryDetails?.[0]?.discounted_price,
          };
        });
        state.count = action.payload?.count;
        state.loading = false;
      })
      .addCase(fetchSearchData.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch products';
      });
  },
});

// Export actions to be used in components
export const {
  setSearchList,
  setSearchQuery,
  /* Add any additional actions if needed */
} = searchProductSlice.actions;

export default searchProductSlice.reducer;
