'use client';

import React, { useState } from 'react';

import { Image, Select } from 'antd';
import { LuCircleHelp, LuGift, LuInfo, LuTag, LuX } from 'react-icons/lu';

import RingSizeChartModal from '@/app/[jewelryType]/premade/RingSizeChartModal';
import EditRingSize from '@/components/CartProductDetails/EditRingSize';
import { useAppDispatch, useAppSelector } from '@/store';
import { setFreeGiftDeclined, setFreeGiftSelection } from '@/store/slices/Cart/freeGiftSlice';
import { formatCurrency } from '@/utils/common';

/**
 * Swatch fills for the metal-colour dropdown, keyed by the Masters row name.
 *
 * CSS rather than the master's `image` array on purpose: these are flat colour chips, so a
 * gradient renders identically everywhere with no extra request and nothing to break when an
 * asset is missing. Unknown names fall back to a neutral disc rather than disappearing.
 */
const METAL_COLOR_SWATCHES: Record<string, string> = {
  yellowgold: 'linear-gradient(135deg, #EBCE83 0%, #C9A227 100%)',
  rosegold: 'linear-gradient(135deg, #F0C6B4 0%, #C98F76 100%)',
  whitegold: 'linear-gradient(135deg, #F5F5F3 0%, #C6C6C4 100%)',
  platinum: 'linear-gradient(135deg, #F2F2F0 0%, #C2C2C0 100%)',
  silver: 'linear-gradient(135deg, #EFEFEF 0%, #BDBDBD 100%)',
  sterlingsilver: 'linear-gradient(135deg, #EFEFEF 0%, #BDBDBD 100%)',
};

const swatchFor = (name?: string | null) =>
  METAL_COLOR_SWATCHES[
    String(name ?? '')
      .toLowerCase()
      .replace(/\s+/g, '')
  ] ?? '#D9D9D9';

/** Shared antd Select overrides so both dropdowns match the rounded reference style. */
const SELECT_SHELL =
  '[&_.ant-select-selector]:!h-[36px] [&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-gray-200 ' +
  '[&_.ant-select-selector]:!bg-white-a700 [&_.ant-select-selector]:!px-3 ' +
  '[&_.ant-select-selection-item]:!leading-[34px] [&_.ant-select-selection-item]:!text-[13px] ' +
  '[&_.ant-select-selection-placeholder]:!leading-[34px] [&_.ant-select-selection-placeholder]:!text-[13px] ' +
  'sm:[&_.ant-select-selector]:!h-[34px] sm:[&_.ant-select-selector]:!px-2.5 ' +
  'sm:[&_.ant-select-selection-item]:!leading-[32px] sm:[&_.ant-select-selection-item]:!text-[12px] ' +
  'sm:[&_.ant-select-selection-placeholder]:!leading-[32px] sm:[&_.ant-select-selection-placeholder]:!text-[12px] ' +
  'sm:[&_.ant-select-arrow]:!right-2';

interface Props {
  /** The cart lines to re-evaluate against after a selection change. */
  cartProducts?: any[];
  /** Checkout shows the gift read-only — colour and size are settled in the cart. */
  readOnly?: boolean;
}

/**
 * Free Gift Above X Amount — the gift card in the cart.
 *
 * Deliberately not a `CartProductDetails`: the gift is derived state, not a cart row, so it
 * has no quantity stepper and no remove control. The branded rail, the struck value and the
 * "you save" pill exist to make the reward feel earned rather than look like a $0 line item.
 */
export default function FreeGiftItem({ cartProducts, readOnly = false }: Props) {
  const dispatch = useAppDispatch();
  const { unlocked, gift, availableVariants, declined } = useAppSelector((state: any) => state.freeGift);
  // Every re-evaluation has to carry the promo code, or changing colour would re-score the cart
  // as though no code were applied and hand back a gift the coupon had just taken away.
  const couponCode = useAppSelector((state: any) => state?.cart?.couponData?.coupon_code ?? null);
  const [isSizeChartOpen, setIsSizeChartOpen] = useState(false);

  if (!unlocked || !gift) {
    return null;
  }

  const handleVariantChange = (offerVariantId: string) => {
    if (readOnly || offerVariantId === gift.offer_variant_id) {
      return;
    }
    dispatch(
      setFreeGiftSelection({
        // The chosen size is carried over. RingSizePricing rows are keyed by
        // (metal_type_id, ring_size_id) and an offer publishes one metal type across all its
        // colours, so switching colour cannot invalidate the size. The server re-checks that
        // the size really belongs to the new variant's metal type and drops it if not, so the
        // shopper is only ever re-prompted when the size genuinely no longer applies.
        selection: { offer_id: gift.offer_id, offer_variant_id: offerVariantId, ring_size_id: gift.ring_size_id ?? null },
        cartProducts,
        couponCode,
      }),
    );
  };

  const handleRingSizeChange = (ringSizeId: string | number) => {
    // Mirrors the guard on handleVariantChange. Unreachable while the picker is gated behind
    // `hasOptions`, but the two handlers should fail the same way if that ever changes.
    if (readOnly) {
      return;
    }
    dispatch(
      setFreeGiftSelection({
        selection: { offer_id: gift.offer_id, offer_variant_id: gift.offer_variant_id, ring_size_id: Number(ringSizeId) },
        cartProducts,
        couponCode,
      }),
    );
  };

  const handleDecline = () => dispatch(setFreeGiftDeclined({ declined: true, cartProducts, couponCode }));
  const handleRestore = () => dispatch(setFreeGiftDeclined({ declined: false, cartProducts, couponCode }));

  // EditRingSize reads only these three paths, so the gift reuses the cart's own control —
  // same options, same metal-correct price row — instead of a second picker that could drift.
  const ringSizeShim = {
    jewelry_sku: { metal_type_id: gift.metal_type_id },
    cartJewelryDetails: { gender_category: gift.gender_category },
    ringSizePricingDetails: gift.ring_size_id ? { id: gift.ring_size_id } : null,
  };

  const count = Number(gift.count) || 1;
  const retailTotal = (Number(gift.retail_price) || 0) * count;
  const hasColorChoice = availableVariants?.length > 1;
  // `requires_ring_size` stays true once a size is chosen; `needs_ring_size` only flags the
  // not-yet-chosen state. Gating the picker on the latter made it vanish the moment a size
  // was selected, leaving no way to correct a mistake.
  const showRingSize = Boolean(gift.requires_ring_size);
  // Always rendered. The gift has at most two choices, so hiding them behind a toggle only
  // added a click between the shopper and the thing they most likely want to change.
  const hasOptions = !readOnly && (hasColorChoice || showRingSize);

  // Turned down from the cart. The card is replaced rather than simply hidden: a reward that
  // disappears without a trace reads as a bug, and this strip is also the only route back to it.
  if (declined) {
    // Checkout mirrors the order, and a refused gift is not on the order. The cart is where the
    // decision is made, so it is where it can be unmade.
    if (readOnly) {
      return null;
    }

    return (
      <div className="flex flex-wrap items-center gap-3.5 rounded-lg border border-secondary/20 bg-[#f5f4ee] px-4 py-3.5 sm:gap-3 sm:px-3 sm:py-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-secondary/20 bg-white-a700 text-secondary sm:h-8 sm:w-8">
          <LuGift className="h-[18px] w-[18px] sm:h-4 sm:w-4" strokeWidth={1.6} />
        </span>
        <p className="min-w-0 flex-1 font-notosans text-[13px] leading-snug text-gray-600 sm:text-[12px]">
          You removed your <span className="font-bold text-secondary">FREE {gift.title}</span>. It is still yours if you want it.
        </p>
        {/* Solid, not outlined: it is the only action here, and the shopper looking at it has
            already turned the gift down once — a ghost button reads as a second dismissal. */}
        <button
          type="button"
          onClick={handleRestore}
          className="shrink-0 rounded-lg bg-secondary px-4 py-2 font-notosans text-[13px] font-medium text-text_w transition-opacity hover:opacity-90 sm:w-full sm:py-2.5 sm:text-[12px]"
        >
          Claim your free gift
        </button>
      </div>
    );
  }

  // Narrow-container variant for the checkout sidebar: small thumbnail, and the price on its
  // own full-width line rather than as a third column.
  const railClass = readOnly ? 'w-[34px] gap-2 py-3' : 'w-[46px] gap-3 py-4 sm:w-[32px] sm:gap-2 sm:py-3';
  const imageClass = readOnly ? 'h-[76px] w-[76px]' : 'h-[176px] w-[176px] md:h-[140px] md:w-[140px] sm:h-[92px] sm:w-[92px]';
  const titleClass = readOnly ? 'text-[16px]' : 'text-[20px] lg:text-[18px] md:text-[17px] sm:text-[15px]';
  const priceClass = readOnly
    ? 'mt-1 basis-full flex-row flex-wrap items-center justify-start gap-x-3 gap-y-1 border-t border-secondary/10 pt-2.5'
    : 'flex-col items-end sm:mt-1 sm:basis-full sm:flex-row sm:flex-wrap sm:items-center sm:justify-start sm:gap-x-3 sm:gap-y-1 sm:border-t sm:border-secondary/10 sm:pt-2.5';

  return (
    <div className="flex overflow-hidden rounded-lg border border-secondary/25 bg-[#fcfcf9]">
      {/* Branded rail — the strongest signal that this row is unlike the paid lines above it. */}
      <div className={`flex shrink-0 flex-col items-center bg-secondary text-text_w ${railClass}`}>
        <LuGift className="h-[18px] w-[18px] shrink-0 sm:h-[15px] sm:w-[15px]" strokeWidth={1.6} />
        <span className="rotate-180 font-sans text-[11px] uppercase leading-none tracking-[2.5px] [writing-mode:vertical-rl] sm:text-[9px] sm:tracking-[1.5px]">
          Free Gift
        </span>
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* `flex-wrap` exists for mobile only: it lets the price block drop to its own line
            (via sm:basis-full) while desktop keeps image / details / price on one row. */}
        <div className={`flex flex-wrap items-start ${readOnly ? 'gap-3 p-3' : 'gap-4 p-4 md:gap-3 sm:gap-3 sm:p-3'}`}>
          <div className={`relative shrink-0 overflow-hidden bg-[#f8f8f8] ${imageClass}`}>
            {/* Clickable for the same reason as the strip's thumbnail: this is the one product
                in the cart the shopper never chose from a PDP, so the card is their only look at
                it. Same preview config as FreeGiftProgress so both open identically. */}
            <Image
              src={gift.image || '/images/no_images.svg'}
              alt={gift.title || 'Free gift'}
              fallback="/images/no_images.svg"
              loading="lazy"
              title={gift.title || 'Free gift'}
              preview={{
                mask: false,
                maskClassName: '!bg-transparent',
                // The gift assets carry heavy white padding, so antd's fit-to-viewport sizing
                // turns the preview into a white slab on a phone. Capping the width pulls it in.
                rootClassName: 'md:[&_.ant-image-preview-img]:!max-w-[72vw] sm:[&_.ant-image-preview-img]:!max-w-[80vw]',
              }}
              className="h-full w-full cursor-zoom-in object-contain mix-blend-multiply"
            />
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-1.5">
            <p className={`font-castoro leading-snug text-gray-800 ${titleClass}`}>{gift.title}</p>

            {/* Only the short facts hold themselves on one line. The metal fact is a joined
                type + colour ("Silver 925 925 Sterling Silver White Gold Plated") that is
                routinely wider than this column — kept unbreakable it overflowed to the right
                and ran underneath the price block. */}
            <p className="flex flex-wrap items-center gap-x-2 gap-y-0.5 font-notosans text-[13px] text-gray-500 sm:text-[11px] sm:leading-relaxed">
              {(
                [
                  { text: [gift.metal_type, gift.metal_color].filter(Boolean).join(' '), nowrap: false },
                  gift.ring_size ? { text: `Size : ${gift.ring_size}`, nowrap: true } : null,
                  { text: `Qty : ${count}`, nowrap: true },
                ].filter((fact) => fact && fact.text) as { text: string; nowrap: boolean }[]
              ).map((fact, index) => (
                <React.Fragment key={fact.text}>
                  {index > 0 && (
                    <span className="text-gray-300" aria-hidden="true">
                      |
                    </span>
                  )}
                  <span className={fact.nowrap ? 'whitespace-nowrap' : 'min-w-0 break-words'}>{fact.text}</span>
                </React.Fragment>
              ))}
            </p>

            {hasOptions && (
              <div className="mt-1 flex flex-col gap-2 sm:mt-0.5">
                {/* Desktop: one row, no `flex-wrap` — the groups compress rather than breaking.
                    Mobile: stacked full-width, because two ~150px dropdowns on a 414px screen
                    are cramped to read and awkward to tap. */}
                <div className="flex items-end gap-4 sm:flex-col sm:items-start sm:gap-2.5">
                  {hasColorChoice && (
                    <div className={`flex min-w-0 flex-col gap-1.5 sm:w-auto sm:gap-1 ${showRingSize ? 'flex-1' : 'w-[150px] md:w-[140px]'}`}>
                      <span className="font-sans text-[11px] uppercase tracking-[1.2px] text-gray-500">Metal Color</span>
                      <Select
                        value={gift.offer_variant_id}
                        onChange={handleVariantChange}
                        popupMatchSelectWidth={false}
                        className={`!w-full sm:!w-[164px] ${SELECT_SHELL}`}
                        options={availableVariants.map((variant: any) => ({
                          value: variant.offer_variant_id,
                          label: (
                            <span className="flex items-center gap-2.5">
                              <span
                                aria-hidden="true"
                                className="h-4 w-4 shrink-0 rounded-full border border-black-900/10"
                                style={{ background: swatchFor(variant.metal_color) }}
                              />
                              <span className="font-notosans text-[13px] text-gray-700">{variant.metal_color ?? variant.sku_code}</span>
                            </span>
                          ),
                        }))}
                      />
                    </div>
                  )}

                  {/* The divider only separates a side-by-side pair; stacked on mobile it would
                      be a stray rule between two full-width controls. */}
                  {hasColorChoice && showRingSize && <div className="h-[36px] w-px shrink-0 bg-gray-200 sm:hidden" aria-hidden="true" />}

                  {showRingSize && (
                    <div
                      // Sized like the colour dropdown: it shares the row when both are shown,
                      // and falls back to the same fixed width when it is the only control —
                      // stretched across the full column a lone size picker read as a search box.
                      className={`flex min-w-0 flex-col gap-1.5 sm:w-auto sm:flex-none sm:gap-1 ${
                        hasColorChoice ? 'flex-1' : 'w-[150px] md:w-[140px]'
                      }`}
                    >
                      <span className="flex shrink-0 items-center gap-1.5 font-sans text-[11px] uppercase tracking-[1.2px] text-gray-500">
                        Ring Size
                        {/* Keeps the Size Guide reachable now the control itself renders bare. */}
                        <button
                          type="button"
                          onClick={() => setIsSizeChartOpen(true)}
                          aria-label="Open the ring size guide"
                          className="text-gray-400 transition-colors hover:text-secondary sm:p-1"
                        >
                          <LuCircleHelp className="h-[15px] w-[15px] sm:h-4 sm:w-4" strokeWidth={1.8} />
                        </button>
                      </span>
                      <EditRingSize
                        productDetails={ringSizeShim}
                        onChange={handleRingSizeChange}
                        hideLabel
                        hideSizeGuide
                        className={`flex w-full items-center [&_.ant-select]:!w-full sm:[&_.ant-select]:!w-[164px] ${SELECT_SHELL}`}
                      />
                      <RingSizeChartModal open={isSizeChartOpen} onClose={() => setIsSizeChartOpen(false)} />
                    </div>
                  )}
                </div>

                {gift.needs_ring_size && (
                  <span className="flex items-center gap-1.5 font-notosans text-[11px] font-semibold text-red-600" role="alert">
                    <LuInfo className="h-[13px] w-[13px] shrink-0" strokeWidth={2} />
                    Please choose a size to continue.
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Desktop: a right-hand column. Mobile: its own full-width line under the pair. */}
          <div className={`flex shrink-0 gap-1.5 ${priceClass}`}>
            {retailTotal > 0 && (
              <span className="font-castoro text-[15px] text-gray-400 line-through sm:text-[13px]">{formatCurrency(Math.ceil(retailTotal))}</span>
            )}
            {/* One statement of the price, not two — "$0" and "FREE" said the same thing. */}
            <span
              className={`font-castoro font-medium uppercase leading-none tracking-[1px] text-secondary ${
                readOnly ? 'text-[20px]' : 'text-[26px] md:text-[22px] sm:text-[19px]'
              }`}
            >
              Free
            </span>
            {retailTotal > 0 && (
              <span
                className={`flex items-center gap-1.5 rounded-full bg-secondary/10 px-3 py-1 font-notosans text-[11px] text-secondary ${
                  readOnly ? 'ml-auto' : 'mt-1 sm:ml-auto sm:mt-0 sm:px-2.5'
                }`}
              >
                <LuTag className="h-3 w-3 shrink-0" strokeWidth={1.8} />
                You save {formatCurrency(Math.ceil(retailTotal))}
              </span>
            )}
          </div>
        </div>

        {/* Checkout has no size picker to point at, so a missing size has to be called out
            here. In the cart the inline message under the picker does that job instead. */}
        {readOnly && gift.needs_ring_size ? (
          <div className="flex items-center gap-2 border-t border-red-600/20 bg-red-50 px-4 py-2 sm:items-start sm:px-3">
            <LuInfo className="h-[14px] w-[14px] shrink-0 text-red-600 sm:mt-[3px]" strokeWidth={1.8} />
            <p className="font-notosans text-[12px] text-red-600 sm:text-[11px] sm:leading-relaxed" role="alert">
              Please return to the cart and choose a ring size for your free gift.
            </p>
          </div>
        ) : (
          <div className="flex items-center gap-2 border-t border-secondary/20 bg-secondary/[0.06] px-4 py-2 sm:items-start sm:px-3">
            <LuInfo className="h-[14px] w-[14px] shrink-0 text-secondary sm:mt-[3px]" strokeWidth={1.8} />
            <p className="font-notosans text-[12px] text-gray-600 sm:text-[11px] sm:leading-relaxed">This is your free gift.</p>

            {/* Declining is a real choice — a shopper who does not want the ring should not have
                to accept it to check out. It sits in the footer rather than beside the price so
                it cannot be mistaken for removing the paid line above. Checkout has no control
                because the gift is settled in the cart, like the colour and the size. */}
            {!readOnly && (
              <button
                type="button"
                onClick={handleDecline}
                className="ml-auto flex shrink-0 items-center gap-1 font-notosans text-[12px] text-gray-500 underline underline-offset-2 transition-colors hover:text-red-600 sm:text-[11px]"
              >
                <LuX className="h-3 w-3 shrink-0" strokeWidth={2.2} />
                Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
