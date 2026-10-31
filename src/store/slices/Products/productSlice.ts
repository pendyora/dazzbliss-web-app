import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import {
  apiFetchPDPFilter,
  apiFetchProducts,
  apiFetchProductsDetails,
  apiFetchProductsFiltersList,
  apiFetchPromotionalImages,
  apiFetchSuggestedProducts,
} from '@/services/productService';

// Define product slices
interface Metal {
  id: string;
  name: string;
  type: string;
  price: number;
}

interface JewelryMetadata {
  id: string;
  metal: Metal;
  shape_id: number;
  jewelry_id: number;
  diamond_shap: { id: string; name: string };
}

export interface Product {
  id: number;
  slug: string;
  code: string;
  customisable: boolean;
  title: string;
  createdAt: string;
  updatedAt: string;
  estimated_delivery_days: number;
  fullTitle: string;
  best_seller: boolean;
  jewelry_sku: JewelryMetadata[];
  wishlist_id: string | null;
}

interface JewelryType {
  id: number;
  name: string;
  discount: number;
  lab_discount: number;
}

interface SubType {
  id: number;
  name: string;
  jewelry_type: JewelryType;
}

export interface ProductData {
  customization_options: any;
  // Closest live variation to open instead of a retired or renamed slug.
  redirect_to_slug?: string | null;
  // Category listing to open when the product is gone.
  redirect_to_category?: string | null;
  // The slug this payload was fetched for.
  requested_slug?: string;
  product_details: {
    jewelry_id: number;
    cadTitle: string;
    subtype: number;
    avg_width: number;
    code: string;
    cad_title: string;
    customisable: boolean;
    default_metal_type: number;
    default_diamond_shape: number;
    description: string;
    details: string | null;
    diamond_price: number;
    favorite: string | null;
    isLabGrown: boolean;
    slug: string;
    tag: string | null;
    title: string;
    meta_title: string;
    meta_description: string;
    weight: number;
    order_index: number | null;
    product_discount: number | null;
    product_lab_discount: number | null;
    estimated_delivery_days: number;
    fullTitle: string;
    jewelry_sku: any | null;
    subType: SubType;
    Relation: any[];
    Occasion: any[];
    gender_category: number;
    is_engraving: boolean;
    diamond_certificate: number;
  };
  product_variation: any;
}
interface ProductList {
  count: number | null;
  rows: Product[];
}

interface Data {
  jewelry_types: Item[];
  metal_color_id: string[];
  diamond_color_id: string[];
  diamond_details: any[];
  shape_id: string[];
  price_range: any;
  carats: string[];
  subTypes: { id: string; name: string }[];
  currency_symbol: string;
  special_title: specialTitleDetails[];
}
interface specialTitleDetails {
  id: string;
  title: string;
}
interface Item {
  id: string;
  name: string;
}

interface Metal {
  id: string;
  name: string;
  image: string[]; // Array of image URLs
}

export interface Shape {
  id: string;
  name: string;
}
export interface FilterData {
  metal?: string[];
  shape?: string[];
  // min_carat?: string | number;
  // max_carat?: string | number;
  min_price?: number;
  max_price?: number;
  // '1 is for both, 2 is for men, 3 is for women'
  gender_category?: 1 | 2 | 3 | any;
  diamond_color: string[];
  sort_order?: string;
  carats: string[];
  subTypes: string[];
  specialTitle?: string[];
}
export interface StackFilterData {
  metal?: string[];
  shape?: string[];
  // min_carat?: string | number;
  // max_carat?: string | number;
  min_price?: number;
  max_price?: number;
  price?: string;
  // '1 is for both, 2 is for men, 3 is for women'
  gender_category?: 1 | 2 | 3 | any;
  diamond_color: string[];
  sort_order?: string;
  carats: string[];
  subTypes: string[];
}

export interface AppraisalDetails {
  appraisalName: string;
  multipler?: number | string;
  polish?: string;
  price: number | string;
  symmetry?: string;
}
export interface WarrantyDetails {
  warrantyName: string;
  yearPrice: { year: number; price: number };
}
export interface EngravingDetails {
  text: string;
  fontFamily: string;
}

export interface ProductState {
  products: ProductList;
  newProducts: Product[];
  loading: boolean;
  PromotionalImages: any[];
  plpWishlistFlag: boolean;
  selectedRingSizeId: null | string;
  selectedRingSizeRedux: null | string;
  selectedAppraisal: null | AppraisalDetails;
  selectedWarranty: null | WarrantyDetails;
  selectedEngraving: null | EngravingDetails;
  iframeSrc: null | string;
  loadingFilterId: null | string;
  filterLoading: boolean;
  filterLoadingFirst: boolean;
  selectedProduct: ProductData;
  filterList: Data;
  filterData: FilterData;
  stackFilterData: StackFilterData;
  selectedCollectionType: string;
  error: string | null;
  shouldLoadList: boolean;
  shouldLoadFilter: boolean;
  pdpfilter: any;
  suggestion: any[];
  productStack: any[];
  isFasterPopup: boolean;
  lastLoadedKey: string | null;
  lastLoadedPage: number;
  pagination: {
    pageSize: number;
    currentPage: number;
  };
}

const initialState: ProductState = {
  products: {
    count: null,
    rows: [],
  },
  plpWishlistFlag: false,
  PromotionalImages: [],
  selectedRingSizeId: null,
  selectedRingSizeRedux: null,
  selectedAppraisal: null,
  selectedWarranty: null,
  selectedEngraving: null,
  iframeSrc: null,
  newProducts: [],
  selectedProduct: {} as ProductData,
  loading: false,
  loadingFilterId: null,
  filterLoading: false,
  filterLoadingFirst: false,
  error: null,
  selectedCollectionType: '',
  shouldLoadList: true,
  shouldLoadFilter: true,
  filterData: {
    metal: [],
    shape: [],
    // min_carat: "",
    // max_carat: "",
    min_price: 0,
    max_price: 0,
    diamond_color: [],
    gender_category: 1,
    sort_order: '',
    carats: [],
    subTypes: [],
  },
  stackFilterData: {
    metal: [],
    shape: [],
    // min_carat: "",
    // max_carat: "",
    min_price: 0,
    max_price: 0,
    diamond_color: [],
    gender_category: 1,
    sort_order: '',
    carats: [],
    subTypes: [],
  },
  filterList: {
    jewelry_types: [],
    metal_color_id: [],
    diamond_color_id: [],
    diamond_details: [],
    shape_id: [],
    price_range: {},
    carats: [],
    subTypes: [],
    currency_symbol: '',
    special_title: [],
  },
  pdpfilter: {},
  suggestion: [],
  productStack: [],
  isFasterPopup: true,
  lastLoadedKey: null,
  lastLoadedPage: 1,
  pagination: {
    pageSize: 20,
    currentPage: 1,
  },
};

// Async thunk for fetching products
export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (
    {
      type,
      data,
      page,
      size,
      collectionType = null,
    }: {
      type: any;
      data: FilterData;
      page: number;
      size: number;
      collectionType?: any;
      silent?: boolean;
      listKey?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiFetchProducts(type, data, page, size, collectionType);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);
// Silent bulk refresh: reloads the first N pages as a single request and replaces the cached
// rows without toggling `loading`. Leaves pagination.currentPage at `lastPage` so the next
// infinite-scroll trigger continues with `lastPage + 1` at normal page size.
export const fetchProductsBulkRefresh = createAsyncThunk(
  'products/fetchProductsBulkRefresh',
  async (
    {
      type,
      data,
      lastPage,
      size,
      collectionType = null,
    }: {
      type: any;
      data: FilterData;
      lastPage: number;
      size: number;
      collectionType?: any;
      listKey?: string;
    },
    { rejectWithValue },
  ) => {
    try {
      const response = await apiFetchProducts(type, data, 1, size * Math.max(lastPage, 1), collectionType);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);
// Async thunk for fetching products
export const fetchProductsFilterList = createAsyncThunk('products/fetchProductsFilterList', async (data: any, { rejectWithValue }) => {
  try {
    const response = await apiFetchProductsFiltersList(data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});
// Async thunk for fetching products details
export const fetchProductsDetails = createAsyncThunk('products/fetchProductsDetails', async (data: string, { rejectWithValue }) => {
  try {
    const response = await apiFetchProductsDetails(data);
    // console.log(response);
    return response.data;
  } catch (error: any) {
    // 301: the variation moved. Load the one it moved to; redirect_to_slug tells the page to update its URL.
    const movedTo = error?.response?.status === 301 ? error.response.data?.redirect_to_slug : null;
    let failure = error;
    if (movedTo) {
      try {
        const response = await apiFetchProductsDetails(movedTo);
        return { ...response.data, data: { ...response.data.data, redirect_to_slug: movedTo } };
      } catch (movedError: any) {
        failure = movedError;
      }
    }
    // A 410 (product no longer available) carries the category listing to send the visitor to.
    return rejectWithValue({ message: failure.message, redirect_to_category: failure?.response?.data?.redirect_to_category ?? null });
  }
});
// Async thunk for fetching products details filters
export const fetchPDPFilters = createAsyncThunk('products/fetchPDPFilters', async (_, { rejectWithValue }) => {
  try {
    const response = await apiFetchPDPFilter();
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});
// Async thunk for fetching products details filters
export const fetchSuggestedProducts = createAsyncThunk('products/fetchSuggestedProducts', async (data: any, { rejectWithValue }) => {
  try {
    const response = await apiFetchSuggestedProducts(data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const fetchPromotionalImages = createAsyncThunk('products/fetchPromotionalImages', async (_: any, { rejectWithValue }) => {
  try {
    const response = await apiFetchPromotionalImages(_);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

const productsSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    // Add any additional reducers if needed
    setLoadingFilterId: (state, action: PayloadAction<any>) => {
      state.loadingFilterId = action.payload;
    },
    setIsFasterPopup: (state, action: PayloadAction<any>) => {
      state.isFasterPopup = action.payload;
    },
    setFilterData: (state, action: PayloadAction<FilterData>) => {
      state.filterData = action.payload;
    },
    setStackFilterData: (state, action: PayloadAction<FilterData>) => {
      state.stackFilterData = action.payload;
    },
    setFilterLoadingFirst: (state) => {
      state.filterLoadingFirst = false;
    },
    clearProducts: (state) => {
      state.products = {
        count: null,
        rows: [],
      };
    },
    clearSelectedProduct: (state) => {
      state.selectedProduct = {} as ProductData;
    },
    setProductsRows: (state, action: PayloadAction<any>) => {
      state.products.rows = action.payload;
    },
    setSelectedProductsDetails: (state, action: PayloadAction<any>) => {
      state.selectedProduct.product_details = action.payload;
    },
    setClearSuggestion: (state) => {
      state.suggestion = [] as any;
    },
    setPlpWishlistFlag: (state) => {
      state.plpWishlistFlag = !state.plpWishlistFlag;
    },
    setShouldLoadList: (state, action: PayloadAction<any>) => {
      state.shouldLoadList = action.payload;
    },
    setShouldLoadFilter: (state, action: PayloadAction<any>) => {
      state.shouldLoadFilter = action.payload;
    },
    setSelectedRingSizeId: (state, action: PayloadAction<any>) => {
      state.selectedRingSizeId = action.payload;
    },
    setSelectedRingSizeRedux: (state, action: PayloadAction<any>) => {
      state.selectedRingSizeRedux = action.payload;
    },
    setSelectedAppraisal: (state, action: PayloadAction<AppraisalDetails | null>) => {
      state.selectedAppraisal = action.payload;
    },
    setSelectedWarranty: (state, action: PayloadAction<WarrantyDetails | null>) => {
      state.selectedWarranty = action.payload;
    },
    setSelectedEngraving: (state, action: PayloadAction<EngravingDetails | null>) => {
      state.selectedEngraving = action.payload;
    },
    setIframeSrc: (state, action: PayloadAction<any>) => {
      state.iframeSrc = action.payload;
    },
    setPageSize: (state, action: PayloadAction<number>) => {
      state.pagination.pageSize = action.payload;
    },
    setCurrentPage: (state, action: PayloadAction<number>) => {
      state.pagination.currentPage = action.payload;
    },
    setProductStack: (state, action: PayloadAction<any[]>) => {
      state.productStack = action.payload;
    },
    resetPagination: (state) => {
      state.pagination = initialState.pagination;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state, action) => {
        if (!action.meta.arg?.silent) {
          state.loading = true;
        }
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<any, string, { arg: any }>) => {
        state.loading = false;
        const data = action.payload.data.rows ?? [];
        const isFirstPage = state.pagination.currentPage === 1;
        state.newProducts = isFirstPage ? data : [...state.newProducts, ...data];
        state.products.count = action.payload.data.count;
        state.products.rows = isFirstPage ? data : [...state.products.rows, ...data];
        // API returns count that can exceed what is actually paginable; clamp count to the
        // accumulated rows when a paginated request returns zero rows so the infinite-scroll
        // guard (`products.length >= count`) stops firing further requests.
        if (!isFirstPage && data.length === 0) {
          state.products.count = state.products.rows.length;
        }
        state.loadingFilterId = null;
        const { listKey } = action.meta.arg ?? {};
        if (listKey) {
          if (state.lastLoadedKey !== listKey) {
            state.lastLoadedPage = state.pagination.currentPage;
          } else {
            state.lastLoadedPage = Math.max(state.lastLoadedPage, state.pagination.currentPage);
          }
          state.lastLoadedKey = listKey;
        }
      })
      .addCase(fetchProducts.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch products';
      })
      .addCase(fetchProductsBulkRefresh.fulfilled, (state, action: PayloadAction<any, string, { arg: any }>) => {
        const data = action.payload.data.rows;
        const { listKey, lastPage } = action.meta.arg ?? {};
        const pageToSet = Math.max(lastPage ?? 1, 1);
        state.products.count = action.payload.data.count;
        state.products.rows = data;
        state.newProducts = data;
        state.pagination.currentPage = pageToSet;
        if (listKey) {
          state.lastLoadedKey = listKey;
          state.lastLoadedPage = pageToSet;
        }
      })
      .addCase(fetchProductsFilterList.pending, (state, action) => {
        state.filterLoading = true;
        if (!action.meta.arg?.silent) {
          state.loading = true;
          // Allow PLP effects that depend on filterLoadingFirst to run again after client-side
          // navigation (value must transition false → true; PDP sets shouldLoadList false, etc.).
          state.filterLoadingFirst = false;
        }
      })
      .addCase(fetchProductsFilterList.fulfilled, (state, action: PayloadAction<any, string, { arg: any }>) => {
        state.filterLoading = false;
        state.filterList = action.payload.data;
        if (!action.meta.arg?.silent) {
          state.loading = true;
          state.filterData = {
            ...state.filterData,
            carats: action.payload.data?.carats ?? '',
            min_price: action.payload.data?.price_range?.min_price ?? 0,
            max_price: action.payload.data?.price_range?.max_price ?? 0,
          };
          state.filterLoadingFirst = true;
        }
      })
      .addCase(fetchProductsFilterList.rejected, (state, action) => {
        state.filterLoading = false;
        if (!action.meta.arg?.silent) {
          state.loading = true;
        }
        state.error = (action.payload as any) || 'Failed to fetch products';
      })
      .addCase(fetchProductsDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProductsDetails.fulfilled, (state, action: any) => {
        state.loading = false;
        // The URL slug changes before the new payload arrives; record which slug this payload is for.
        state.selectedProduct = { ...action.payload.data, requested_slug: action.meta?.arg };
      })
      .addCase(fetchProductsDetails.rejected, (state, action: any) => {
        state.loading = false;
        // Stamped on failure too, so the page stops showing its loader.
        state.selectedProduct = {
          ...state.selectedProduct,
          requested_slug: action.meta?.arg,
          redirect_to_category: action.payload?.redirect_to_category ?? null,
        };
      })
      .addCase(fetchPDPFilters.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPDPFilters.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // console.log(action.payload.data);
        //   state.selectedProduct = action.payload;
        state.pdpfilter = action.payload.data;
      })
      .addCase(fetchPDPFilters.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchPromotionalImages.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchPromotionalImages.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.PromotionalImages = action.payload?.data || [];
      })
      .addCase(fetchPromotionalImages.rejected, (state) => {
        state.loading = false;
      })
      .addCase(fetchSuggestedProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchSuggestedProducts.fulfilled, (state, action: PayloadAction<any>) => {
        // console.log(action.payload.data);
        //   state.selectedProduct = action.payload;
        // state.suggestion = action.payload.data;
        state.suggestion = action.payload.data?.map((item: any) => {
          const carat_image = item?.jewelryDetails?.[0]?.carat_images || [];
          const jewelryTypeName = item?.jewelrySubType?.parentDetails?.name;
          const jewelryType = jewelryTypeName?.toLowerCase()?.replace(' ', '-');
          const jewelryDetails = item?.jewelryDetails?.[0];
          return {
            jewelry_id: item?.id,
            sku_master_id: item?.jewelryDetails?.[0]?.id,
            variation_to_show: item?.variation_to_show,
            variation_details: item?.variation_details,
            jewelryDetails,
            jewelryTypeData: jewelryType,
            // slug: item?.jewelryDetails?.[0]?.sku_slug,
            slug: item?.is_customizable ? item.jewelryDetails[0]?.sku_slug : `${jewelryType}/premade?slug=${item.jewelryDetails[0]?.sku_slug}`,
            productPrice: item?.jewelryDetails?.[0]?.selling_price,
            productName: item?.title,
            // Yotpo keys reviews by this product-level code — the card's star rating needs it.
            code: item?.code,
            is_customizable: item?.is_customizable,
            productHoverImage: carat_image[1] ? `${carat_image[1]}` : '/images/no_images.svg', // Placeholder hover image URL
            productImage: carat_image[0] ? `${carat_image[0]}` : '/images/no_images.svg', // Placeholder image URL
            stackable_image: item?.jewelryDetails?.[0]?.stackable_image ?? '/images/no_images.svg',
            isWishlist: item?.jewelryDetails?.[0]?.wishlist_id, // Assuming false for all items, can be adjusted if needed
            jewelry_type: item?.jewelrySubType?.group, // Assuming jewelry type is the same as category name
            discount_type: item?.jewelryDetails?.[0]?.discount_type,
            discount_value: item?.jewelryDetails?.[0]?.discount_value,
            discounted_price: item?.jewelryDetails?.[0]?.discounted_price,
            specialProductTitles: item?.specialProductTitles || [],
          };
        });
        state.loading = false;
      })
      .addCase(fetchSuggestedProducts.rejected, (state) => {
        state.loading = false;
      });
  },
});

// Export actions to be used in components
export const {
  setLoadingFilterId,
  setFilterData,
  setStackFilterData,
  clearProducts,
  setSelectedProductsDetails,
  clearSelectedProduct,
  setClearSuggestion,
  setProductsRows,
  setPlpWishlistFlag,
  setShouldLoadList,
  setShouldLoadFilter,
  setSelectedRingSizeId,
  setSelectedRingSizeRedux,
  setSelectedAppraisal,
  setSelectedWarranty,
  setSelectedEngraving,
  setIframeSrc,
  setIsFasterPopup,
  setPageSize,
  setCurrentPage,
  resetPagination,
  setFilterLoadingFirst,
  setProductStack,
  /* Add any additional actions if needed */
} = productsSlice.actions;

export default productsSlice.reducer;
