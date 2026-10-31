import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

import {
  apiAddToCart,
  apiAddToCheckout,
  apiAddToWishList,
  apiGetCartList,
  apiGetLoalCartList,
  apiGetWishList,
  apiRemoveCart,
  apiVerifyCoupon,
} from '@/services/cartService';

const initialState: any = {
  cartProducts: [] as any,
  wishlistProducts: [] as any,
  wishlistAPIProducts: [] as any,
  productCounts: 0,
  checkoutDetails: [],
  loading: false,
  couponData: null,
  guestDetails: [],
};

/**
 * The code the shopper applied, remembered across page loads.
 *
 * `couponData` itself is never persisted — it holds server-computed per-item prices that go
 * stale the moment the cart changes. Only the code is kept, and it is re-verified against the
 * live cart before it counts for anything.
 */
const APPLIED_COUPON_KEY = 'appliedCoupon';

export const readStoredCoupon = (): string | null => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    return localStorage.getItem(APPLIED_COUPON_KEY);
  } catch {
    return null;
  }
};

const writeStoredCoupon = (code: string | null) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (code) {
      localStorage.setItem(APPLIED_COUPON_KEY, code);
    } else {
      localStorage.removeItem(APPLIED_COUPON_KEY);
    }
  } catch {
    /* ignore — a blocked localStorage just means the code is not remembered */
  }
};

export const verifyCoupon = createAsyncThunk('cart/verifyCoupon', async (couponData: any, { rejectWithValue }) => {
  try {
    const response = await apiVerifyCoupon(couponData);
    // Remembered only once the server has accepted it, so a rejected code is never carried
    // forward to the next page and re-tried there.
    if (response.data?.status === 200 || response.data?.data) {
      writeStoredCoupon(String(couponData?.coupon_code ?? '').trim() || null);
    }
    return response.data;
  } catch (error: any) {
    return error;
  }
});

/**
 * Re-apply the remembered code to the current cart.
 *
 * Re-verified rather than restored from storage: the cart may have changed since, and the
 * discount has to come from the server anyway — the stored value is a code, never an amount.
 * A code the server now refuses (expired, cart below its minimum) is forgotten quietly; the
 * shopper never asked for it on this page, so an error toast would come out of nowhere.
 */
export const restoreAppliedCoupon = createAsyncThunk(
  'cart/restoreAppliedCoupon',
  async ({ updatedCartProducts }: { updatedCartProducts?: any[] }, { dispatch }) => {
    const code = readStoredCoupon();
    if (!code) {
      return null;
    }

    // The lines are always sent. A signed-in shopper is scored against the DB cart and the
    // server ignores them; everyone else needs them — including a guest at checkout, whose
    // cart may not have been synced yet, which is exactly when this runs. Gating on "is this a
    // guest?" got that backwards and asked the server to price an empty cart.
    const res: any = await dispatch(verifyCoupon({ coupon_code: code, updatedCartProducts: updatedCartProducts ?? [] }));

    // A failure is not proof the code is dead — the cart may still be loading, the request may
    // have failed, or the shopper may be mid-way through a guest sign-in. The code is left in
    // storage so the next attempt can succeed; only an explicit removal or an emptied cart
    // forgets it.
    return res?.payload?.status === 200 ? code : null;
  },
);
export const fetchCartProducts = createAsyncThunk('cart/fetchCartProducts', async ({ data }: { data: any }, { rejectWithValue }) => {
  try {
    const response = await apiAddToCart(data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const fetchCheckoutProducts = createAsyncThunk('cart/checkout/fetchCheckoutProducts', async ({ data }: { data: any }, { rejectWithValue }) => {
  try {
    const response = await apiAddToCheckout(data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const fetchCartProductsList = createAsyncThunk('cart/fetchCartProductsList', async (_, { rejectWithValue }) => {
  try {
    const response = await apiGetCartList();
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const fetchLocalCartProductsList = createAsyncThunk(
  'cart/products/fetchLocalCartProductsList',
  async ({ data }: { data: any }, { rejectWithValue }) => {
    // console.log("data-=-=--->", data);

    try {
      const response = await apiGetLoalCartList(data);

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.message);
    }
  },
);

export const fetchRemoveProduct = createAsyncThunk('cart/:id/fetchRemoveProduct', async (id: any, { rejectWithValue }) => {
  // console.log("data-=-=--->", data);

  try {
    const response = await apiRemoveCart(id);
    // console.log("resssponseeeee-->", response);

    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const fetchWishListProducts = createAsyncThunk('cart/fetchWishListProducts', async (data: string, { rejectWithValue }) => {
  try {
    const response = await apiGetWishList(data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});

export const AddWishListProducts = createAsyncThunk('cart/AddWishListProducts', async ({ data }: { data: any }, { rejectWithValue }) => {
  try {
    const response = await apiAddToWishList(data);
    return response.data;
  } catch (error: any) {
    return rejectWithValue(error.message);
  }
});
const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    clearCartProducts: (state) => {
      state.cartProducts = [];
      state.productCounts = 0;
    },
    clearWishlistProducts: (state) => {
      state.wishlistProducts = [];
    },
    clearCouponData: (state) => {
      state.couponData = null;
      // Cleared here rather than at each call site: three separate screens remove a coupon, and
      // one of them forgetting would leave the code to reappear on the next page load.
      writeStoredCoupon(null);
    },
    addCartProductCounts: (state, action) => {
      // console.log("action--->", action);

      state.productCounts = action?.payload || 0;
    },
    setCartProducts: (state, action) => {
      state.cartProducts = action?.payload || [];
    },
    setWishlistProducts: (state, action) => {
      state.wishlistProducts = action?.payload || [];
    },
    setGuestDetails: (state, action) => {
      state.guestDetails = action?.payload || [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCartProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCartProducts.fulfilled, (state) => {
        state.loading = false;
        // console.log("action---->", action.payload.data);
        // state.cartProducts = action.payload.data;
      })
      .addCase(fetchCartProducts.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch products';
      })
      .addCase(fetchCartProductsList.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCartProductsList.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.cartProducts = action.payload.data;
        state.productCounts = action.payload.data?.length || 0;
      })
      .addCase(fetchCartProductsList.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch products';
      })
      .addCase(fetchLocalCartProductsList.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchLocalCartProductsList.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // console.log("action--->", action);
        state.cartProducts = action.payload.data;
        state.productCounts = action.payload.data?.length || 0;
      })
      .addCase(fetchLocalCartProductsList.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch products';
      })
      .addCase(fetchRemoveProduct.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRemoveProduct.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // console.log("action--->", action);
        state.cartProducts = action.payload.data;
        state.productCounts = action.payload.data?.length ?? 0;
      })
      .addCase(fetchRemoveProduct.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch products';
      })
      .addCase(fetchCheckoutProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCheckoutProducts.fulfilled, (state, action: PayloadAction<any>) => {
        state.loading = false;
        // console.log("action--->", action);
        state.checkoutDetails = action.payload.data;
      })
      .addCase(fetchCheckoutProducts.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch products';
      })
      .addCase(fetchWishListProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchWishListProducts.fulfilled, (state, action: PayloadAction<any>) => {
        // console.log("action--->", action);
        state.wishlistAPIProducts = action.payload.data;
        state.wishlistProducts = action.payload.data?.map((category: any) => {
          return {
            name: category.name.toUpperCase(), // Convert category name to uppercase
            jewelry: category.jewelry.map((item: any) => {
              const carat_image = item.skuDetails?.carat_images || [];
              const jewelryTypeName = item?.subTypeDetails?.parent_code;
              const jewelryTypeData = jewelryTypeName?.toLowerCase()?.replace('_', '-');
              // Use skuDetails to drive initial selected variation in ProductProfile
              const jewelryDetails = item?.skuDetails;
              return {
                jewelry_id: item.id,
                sku_master_id: item.skuDetails.id,
                slug: item?.is_customizable ? item.skuDetails.sku_slug : `${jewelryTypeData}/premade?slug=${item.skuDetails.sku_slug}`,
                productPrice: item.skuDetails.selling_price,
                productName: item.fullTitle,
                // Yotpo keys reviews by this product-level code — the card's star rating needs it.
                code: item?.code,
                variation_to_show: item?.variation_to_show,
                variation_details: item?.variation_details,
                jewelryDetails,
                jewelryTypeData,
                is_customizable: item?.is_customizable,
                productHoverImage: carat_image[1] ? `${carat_image[1]}` : '/images/no_images.svg', // Placeholder hover image URL
                productImage: carat_image[0] ? `${carat_image[0]}` : '/images/no_images.svg', // Placeholder image URL
                isWishlist: item?.wishlist_id, // Assuming false for all items, can be adjusted if needed
                jewelry_type: category?.name.toUpperCase(), // Assuming jewelry type is the same as category name
                discount_type: item?.skuDetails?.discount_type,
                discount_value: item?.skuDetails?.discount_value,
                discounted_price: item?.skuDetails?.discounted_price,
                specialProductTitles: item?.specialProductTitles,
              };
            }),
          };
        });
        state.loading = false;
      })
      .addCase(fetchWishListProducts.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch products';
      })
      .addCase(AddWishListProducts.pending, (state) => {
        state.loading = true;
      })
      .addCase(AddWishListProducts.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(AddWishListProducts.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch products';
      })
      .addCase(verifyCoupon.fulfilled, (state, action: PayloadAction<any>) => {
        state.couponData = action.payload.data;
      })
      .addCase(verifyCoupon.rejected, (state, action: PayloadAction<any>) => {
        state.error = action.payload || 'Failed to verify coupon';
      });
  },
});

// Export actions to be used in components
export const {
  clearCartProducts,
  clearWishlistProducts,
  addCartProductCounts,
  setCartProducts,
  setWishlistProducts,
  clearCouponData,
  setGuestDetails,
  /* Add any additional actions if needed */
} = cartSlice.actions;

export default cartSlice.reducer;
