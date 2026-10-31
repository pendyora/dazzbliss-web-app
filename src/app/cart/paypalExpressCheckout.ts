import dayjs from 'dayjs';

import { varifyEmailApi } from '@/services/cartService';
import { apiCapturePayPalExpressOrder, apiGetPayPalExpressOrderDetails } from '@/services/paypalService';
import { clearAuthState } from '@/store/slices/auth/authSlice';
import { clearCartProducts, setGuestDetails } from '@/store/slices/Cart/cartSlice';
import { setGuestUserOrderDetails } from '@/store/slices/Order/orderSlice';
import { buildWalletAddressPayload, createAddress, norm } from '@/utils/walletAddress';

type CompleteArgs = {
  paypalOrderId: string;
  cart: any[];
  couponCode?: string | null;
  user: any;
  dispatch: any;
  /** Chosen gift variant, identifiers only — re-resolved and priced at $0 server-side. */
  freeGift?: { offer_id?: number | null; offer_variant_id?: string | null; ring_size_id?: number | null; declined?: boolean } | null;
};

/**
 * Completes a PayPal Express Checkout order end-to-end without any confirmation page:
 *   details → (guest) user → delivery + billing Address (from PayPal's address) → capture.
 * Returns the created order id. Throws with a user-facing message on any failure.
 */
export async function completeExpressCheckout({ paypalOrderId, cart, couponCode, user, dispatch, freeGift }: CompleteArgs): Promise<string> {
  // 1. Read the buyer contact + shipping address PayPal collected in the popup.
  const detailsRes: any = await apiGetPayPalExpressOrderDetails(paypalOrderId);
  const details = detailsRes?.data?.data;
  if (!details || details.status !== 'APPROVED') {
    throw new Error('This PayPal order can no longer be completed. Please try again.');
  }
  const payer = details.payer || {};
  const shipping = details.shipping || {};
  if (!shipping?.address_line_1) {
    throw new Error('No delivery address was provided in PayPal. Please add a shipping address in PayPal and try again.');
  }

  // 2. Guests: create (or attach to) a user via the PayPal email to obtain a token for the
  //    address + capture calls. Logged-in users already have an auth token — skip.
  const isLoggedIn = Boolean(user && !user?.is_guest);
  if (!isLoggedIn && payer.email) {
    const verifyRes: any = await varifyEmailApi({ email: norm(payer.email) });
    const verified = verifyRes?.data?.data;
    if (verified?.token) {
      dispatch(setGuestDetails({ ...verified, email: norm(payer.email) }));
    }
  }

  // 3. Best-effort map PayPal's address strings to DB foreign-key ids.
  const fullName = String(shipping?.full_name || '').trim();
  const baseAddress = await buildWalletAddressPayload({
    firstName: payer.first_name || fullName.split(' ')[0] || 'PayPal',
    lastName: payer.last_name || fullName.split(' ').slice(1).join(' ') || 'Customer',
    address1: shipping.address_line_1,
    address2: shipping?.address_line_2,
    city: shipping?.admin_area_2,
    province: shipping?.admin_area_1,
    postalCode: shipping?.postal_code,
    countryCode: shipping?.country_code,
    phone: payer.phone,
    email: payer.email,
  });

  // 4. Create delivery (type 1) + billing (type 2) Address rows for this user. PayPal returns a
  //    single address, so billing mirrors the confirmed shipping address.
  let deliveryId: any;
  let billingId: any;
  try {
    deliveryId = await createAddress(baseAddress, 1);
    billingId = await createAddress(baseAddress, 2);
  } catch {
    throw new Error('Could not save the delivery address. Please try again.');
  }

  // 5. Shipping window from the cart (max estimated_delivery_days), same as the checkout page.
  const days: number[] = (cart || []).map((item: any) => Number(item?.cartJewelryDetails?.estimated_delivery_days) || 0);
  const maxDays = days.length > 0 ? Math.max(...days) : 0;

  // 6. Capture the already-approved payment and finalize the order server-side.
  const capturePayload = {
    paypal_order_id: paypalOrderId,
    delivery_address: deliveryId,
    billing_address: billingId,
    coupon_code: couponCode || undefined,
    start_shipping_date: dayjs().add(maxDays, 'days').toISOString(),
    end_shipping_date: dayjs()
      .add(15 + maxDays, 'days')
      .toISOString(),
    updatedCartProducts: cart || [],
    ...(freeGift ? { free_gift: freeGift } : {}),
  };
  const captureRes: any = await apiCapturePayPalExpressOrder(capturePayload);

  const responseData = captureRes?.data?.data;
  const orderId = responseData?.order?.order_id || responseData?.redirectUrl?.split('order_id=')?.[1];

  // 7. Clear the cart + persist guest order details for the thank-you page.
  dispatch(clearCartProducts());
  try {
    localStorage.removeItem('cartItems');
    sessionStorage.removeItem('storefront_pp_express');
  } catch {
    /* ignore */
  }

  if (responseData?.is_guest && responseData?.guestUserOrderDetails) {
    dispatch(setGuestUserOrderDetails(responseData.guestUserOrderDetails));
    try {
      if (orderId) {
        sessionStorage.setItem(`storefront_guest_order_${orderId}`, JSON.stringify(responseData.guestUserOrderDetails));
      }
    } catch {
      /* ignore */
    }
    try {
      localStorage.removeItem('admin');
    } catch {
      /* ignore */
    }
    dispatch(clearAuthState());
  }

  return orderId;
}
