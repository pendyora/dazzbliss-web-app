import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

import { apiEvaluateFreeGift } from '@/services/freeGiftService';

/**
 * Free Gift Above X Amount — storefront state.
 *
 * Everything here is server-computed. The slice never derives eligibility or prices itself:
 * the whole point of the feature is that the threshold is judged against database prices, not
 * against whatever the browser happens to be holding.
 */

/** Where a guest's chosen colour/size lives between page loads. */
const FREE_GIFT_SELECTION_KEY = 'freeGiftSelection';

export type FreeGiftSelection = {
  offer_id?: number | null;
  offer_variant_id?: string | null;
  ring_size_id?: number | null;
  /** The shopper turned the gift down. Stored beside the colour/size for the same reasons. */
  declined?: boolean;
} | null;

const readStoredSelection = (): FreeGiftSelection => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = localStorage.getItem(FREE_GIFT_SELECTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const writeStoredSelection = (selection: FreeGiftSelection) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    if (selection) {
      localStorage.setItem(FREE_GIFT_SELECTION_KEY, JSON.stringify(selection));
    } else {
      localStorage.removeItem(FREE_GIFT_SELECTION_KEY);
    }
  } catch {
    /* ignore — a blocked localStorage just means the choice is not remembered */
  }
};

const initialState: any = {
  loading: false,
  evaluated: false,
  subtotal: 0,
  unlocked: false,
  /** Earned but turned down — the gift card is replaced by an offer to add it back. */
  declined: false,
  remaining: 0,
  progress: 0,
  activeOffer: null,
  nextOffer: null,
  gift: null,
  availableVariants: [],
  /** Every configured tier, cheapest first — drives the cart's milestone track. */
  milestones: [],
  selection: null,
  /** Set when a previously-unlocked gift disappears, so the cart can explain why. */
  giftJustRemoved: false,
};

export const evaluateFreeGift = createAsyncThunk(
  'freeGift/evaluate',
  async ({ cartProducts, couponCode }: { cartProducts?: any[]; couponCode?: string | null }, { rejectWithValue }) => {
    try {
      const stored = readStoredSelection();
      const response = await apiEvaluateFreeGift({
        // Only identifiers are read server-side; sending the whole line is simply convenient.
        updatedCartProducts: cartProducts ?? [],
        selection: stored,
        // The code only. The discount behind it is recomputed server-side from the coupon row.
        coupon_code: couponCode ?? null,
      });

      // A refusal is about one earned gift, not a standing preference — so it expires the moment
      // the cart stops qualifying. Without this the flag outlives the order that carried it, and
      // the shopper's *next* qualifying cart would silently arrive with no gift and no
      // explanation. Cheaper and more reliable than clearing it from each of the eight places an
      // order can complete.
      if (stored?.declined && !response.data?.data?.unlocked) {
        writeStoredSelection({ ...stored, declined: false });
        if (response.data?.data) {
          response.data.data.declined = false;
        }
      }

      return response.data;
    } catch (error: any) {
      return rejectWithValue(error?.message);
    }
  },
);

/**
 * Turn the gift down, or take it back.
 *
 * Written to localStorage first so the card responds at once, then re-evaluated — the same
 * shape as `setFreeGiftSelection`, and for the same reason: the server is what actually
 * decides whether the gift lands on the order, so the two must not be allowed to drift.
 */
export const setFreeGiftDeclined = createAsyncThunk(
  'freeGift/setDeclined',
  async ({ declined, cartProducts, couponCode }: { declined: boolean; cartProducts?: any[]; couponCode?: string | null }, { dispatch }) => {
    // Spread the stored selection rather than replacing it: declining must not cost the shopper
    // the colour and size they already picked, or taking the gift back would re-prompt for both.
    writeStoredSelection({ ...(readStoredSelection() ?? {}), declined });
    await dispatch(evaluateFreeGift({ cartProducts, couponCode }));
    return declined;
  },
);

/**
 * Drop a stored refusal without re-evaluating. For the empty cart, where there is nothing to
 * evaluate against and so no response to expire the flag — see `evaluateFreeGift`.
 */
export const forgetGiftDecline = () => {
  const stored = readStoredSelection();
  if (stored?.declined) {
    writeStoredSelection({ ...stored, declined: false });
  }
};

/**
 * Change the gift variant.
 *
 * The choice is held in localStorage only — the same path for guests and signed-in shoppers,
 * since a guest has nowhere server-side to keep it either. It is written first so the control
 * responds instantly, then the cart is re-evaluated so the card shows the real SKU. The server
 * revalidates the choice against the qualifying offer on every evaluation, so a stale or
 * tampered value can never grant the wrong gift.
 */
export const setFreeGiftSelection = createAsyncThunk(
  'freeGift/setSelection',
  async (
    { selection, cartProducts, couponCode }: { selection: FreeGiftSelection; cartProducts?: any[]; couponCode?: string | null },
    { dispatch },
  ) => {
    writeStoredSelection(selection);
    await dispatch(evaluateFreeGift({ cartProducts, couponCode }));
    return selection;
  },
);

const freeGiftSlice = createSlice({
  name: 'freeGift',
  initialState,
  reducers: {
    clearFreeGift: () => ({ ...initialState }),
  },
  extraReducers: (builder) => {
    builder
      .addCase(evaluateFreeGift.pending, (state) => {
        state.loading = true;
      })
      .addCase(evaluateFreeGift.fulfilled, (state, action: PayloadAction<any>) => {
        const data = action.payload?.data ?? {};
        const wasUnlocked = state.unlocked;

        state.loading = false;
        state.evaluated = true;
        state.subtotal = data.subtotal ?? 0;
        state.unlocked = Boolean(data.unlocked);
        state.declined = Boolean(data.declined);
        state.remaining = data.remaining ?? 0;
        state.progress = data.progress ?? 0;
        state.activeOffer = data.activeOffer ?? null;
        state.nextOffer = data.nextOffer ?? null;
        state.gift = data.gift ?? null;
        state.availableVariants = data.availableVariants ?? [];
        state.milestones = data.milestones ?? [];
        // Losing an unlocked gift is the one transition worth calling out — the shopper removed
        // an item, cut a quantity, or applied a promo code that dropped the cart back under the
        // threshold.
        state.giftJustRemoved = wasUnlocked && !data.unlocked;
      })
      .addCase(evaluateFreeGift.rejected, (state) => {
        state.loading = false;
        state.evaluated = true;
        // Fail closed: no offer shown rather than a stale one.
        state.unlocked = false;
        state.gift = null;
      })
      .addCase(setFreeGiftSelection.fulfilled, (state, action: PayloadAction<FreeGiftSelection>) => {
        state.selection = action.payload;
      });
  },
});

export const { clearFreeGift } = freeGiftSlice.actions;

export default freeGiftSlice.reducer;
