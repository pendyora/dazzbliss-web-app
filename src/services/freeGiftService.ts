import { encrypt } from '@/utils/enc-decy';

import ApiService from './ApiService';

/**
 * Free Gift Above X Amount.
 *
 * `evaluate` is the only endpoint the feature has, and the only source of truth for the progress bar and the gift itself. The cart
 * lines are sent so guests (who have no server cart) can be scored too, but the backend reads
 * only their identifiers — every price behind the threshold is re-read from the database.
 *
 * The applied promo code is sent as a *code*, never as an amount: the backend re-reads the
 * coupon and recomputes the reduction itself. Eligibility is judged on what the shopper
 * actually pays for the products, so applying a code can take a gift back — which is why the
 * cart re-evaluates whenever the code changes.
 */
export async function apiEvaluateFreeGift(data: {
  updatedCartProducts?: any[];
  selection?: { offer_id?: number | null; offer_variant_id?: string | null; ring_size_id?: number | null; declined?: boolean } | null;
  coupon_code?: string | null;
}) {
  return ApiService.fetchData<any>({
    url: '/free-gift/evaluate',
    method: 'post',
    data: encrypt(data),
  });
}
