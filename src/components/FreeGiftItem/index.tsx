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

/** Shared antd Select overrides so both dropdowns match the bag's square, hairline selects. */
const SELECT_SHELL =
  '[&_.ant-select-selector]:!h-[40px] [&_.ant-select-selector]:!rounded-none [&_.ant-select-selector]:!border-line ' +
  '[&_.ant-select-selector]:!bg-paper [&_.ant-select-selector]:!px-3 ' +
  '[&_.ant-select-selection-item]:!leading-[38px] [&_.ant-select-selection-item]:!text-[12.5px] ' +
  '[&_.ant-select-selection-placeholder]:!leading-[38px] [&_.ant-select-selection-placeholder]:!text-[12.5px] ' +
  'sm:[&_.ant-select-selector]:!h-[38px] sm:[&_.ant-select-selector]:!px-2.5 ' +
  'sm:[&_.ant-select-selection-item]:!leading-[36px] sm:[&_.ant-select-selection-item]:!text-[12px] ' +
  'sm:[&_.ant-select-selection-placeholder]:!leading-[36px] sm:[&_.ant-select-selection-placeholder]:!text-[12px] ' +
  'sm:[&_.ant-select-arrow]:!right-2';

/** The bag's field caption. */
const LABEL = 'text-[10.5px] uppercase tracking-[0.16em] text-ink-soft';

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
      <div className="mt-5 flex flex-wrap items-center gap-4 bg-stone px-5 py-4 font-libre sm:gap-3 sm:px-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center border border-line bg-paper text-gilt sm:h-8 sm:w-8">
          <LuGift className="h-[18px] w-[18px] sm:h-4 sm:w-4" strokeWidth={1.6} />
        </span>
        <p className="m-0 min-w-0 flex-1 text-[13px] leading-[1.5] text-ink-soft sm:text-[12.5px]">
          You removed your <span className="font-medium text-ink">FREE {gift.title}</span>. It is still yours if you want it.
        </p>
        {/* Solid, not outlined: it is the only action here, and the shopper looking at it has
            already turned the gift down once — a ghost button reads as a second dismissal. */}
        <button
          type="button"
          onClick={handleRestore}
          className="h-10 shrink-0 bg-ink px-5 text-[10.5px] font-medium uppercase tracking-[0.18em] text-paper transition-colors hover:bg-ink-hover sm:w-full"
        >
          Claim your free gift
        </button>
      </div>
    );
  }

  // Two layouts of the same facts: in the bag the gift reads as one more line of the list (big
  // tile, serif name, price column); in the checkout summary it matches the compact mini rows.
  const imageClass = readOnly ? 'w-[60px]' : 'w-[clamp(104px,12vw,148px)] sm:w-[88px]';
  const titleClass = readOnly ? 'text-[13px] font-medium font-libre' : 'font-cormorant text-[25px] font-medium leading-[1.1] sm:text-[21px]';

  const facts = (
    [
      { text: [gift.metal_type, gift.metal_color].filter(Boolean).join(' '), nowrap: false },
      gift.ring_size ? { text: `Size : ${gift.ring_size}`, nowrap: true } : null,
      { text: `Qty : ${count}`, nowrap: true },
    ].filter((fact) => fact && fact.text) as { text: string; nowrap: boolean }[]
  ).map((fact, index) => (
    <React.Fragment key={fact.text}>
      {index > 0 && (
        <span className="text-line-strong" aria-hidden="true">
          ·
        </span>
      )}
      <span className={fact.nowrap ? 'whitespace-nowrap' : 'min-w-0 break-words'}>{fact.text}</span>
    </React.Fragment>
  ));

  return (
    <div className={`font-libre text-ink ${readOnly ? 'border-t border-line pt-3.5' : 'border-b border-line py-7'}`}>
      <div className={`flex items-start ${readOnly ? 'gap-3.5' : 'gap-[clamp(16px,2.4vw,32px)] sm:flex-wrap sm:gap-x-4 sm:gap-y-2.5'}`}>
        <div className={`relative aspect-[4/5] shrink-0 overflow-hidden bg-stone [&_.ant-image]:h-full [&_.ant-image]:w-full ${imageClass}`}>
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

        <div className={`flex min-w-0 flex-1 flex-col ${readOnly ? 'gap-1' : 'gap-2.5 sm:gap-2'}`}>
          {/* The kicker is the strongest signal that this row is unlike the paid lines above it. */}
          <span className="flex items-center gap-1.5 text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">
            <LuGift className="h-3.5 w-3.5 shrink-0" strokeWidth={1.6} aria-hidden="true" />
            Free gift
          </span>
          <p className={`m-0 text-ink ${titleClass}`}>{gift.title}</p>

          {/* Only the short facts hold themselves on one line. The metal fact is a joined
              type + colour ("Silver 925 925 Sterling Silver White Gold Plated") that is
              routinely wider than this column — kept unbreakable it overflowed to the right
              and ran underneath the price block. */}
          <p className={`m-0 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-ink-soft ${readOnly ? 'text-[12px]' : 'text-[13px] sm:text-[12px]'}`}>
            {facts}
          </p>

          {hasOptions && (
            <div className="mt-1 flex flex-col gap-2">
              {/* Desktop: one row, no `flex-wrap` — the groups compress rather than breaking.
                  Mobile: stacked full-width, because two ~150px dropdowns on a 414px screen
                  are cramped to read and awkward to tap. */}
              <div className="flex items-end gap-4 sm:flex-col sm:items-start sm:gap-2.5">
                {hasColorChoice && (
                  <div className={`flex min-w-0 flex-col gap-1.5 sm:w-auto ${showRingSize ? 'flex-1 max-w-[220px]' : 'w-[190px] md:w-[170px]'}`}>
                    <span className={LABEL}>Metal Color</span>
                    <Select
                      value={gift.offer_variant_id}
                      onChange={handleVariantChange}
                      popupMatchSelectWidth={false}
                      className={`!w-full sm:!w-[180px] ${SELECT_SHELL}`}
                      options={availableVariants.map((variant: any) => ({
                        value: variant.offer_variant_id,
                        label: (
                          <span className="flex items-center gap-2.5">
                            <span
                              aria-hidden="true"
                              className="h-3.5 w-3.5 shrink-0 rounded-full border border-ink/10"
                              style={{ background: swatchFor(variant.metal_color) }}
                            />
                            <span className="text-[12.5px] text-ink">{variant.metal_color ?? variant.sku_code}</span>
                          </span>
                        ),
                      }))}
                    />
                  </div>
                )}

                {showRingSize && (
                  <div
                    // Sized like the colour dropdown: it shares the row when both are shown,
                    // and falls back to the same fixed width when it is the only control —
                    // stretched across the full column a lone size picker read as a search box.
                    className={`flex min-w-0 flex-col gap-1.5 sm:w-auto sm:flex-none ${hasColorChoice ? 'flex-1 max-w-[220px]' : 'w-[190px] md:w-[170px]'}`}
                  >
                    <span className={`flex shrink-0 items-center gap-1.5 ${LABEL}`}>
                      Ring Size
                      {/* Keeps the Size Guide reachable now the control itself renders bare. */}
                      <button
                        type="button"
                        onClick={() => setIsSizeChartOpen(true)}
                        aria-label="Open the ring size guide"
                        className="text-ink-faint transition-colors hover:text-ink sm:p-1"
                      >
                        <LuCircleHelp className="h-[14px] w-[14px] sm:h-4 sm:w-4" strokeWidth={1.8} />
                      </button>
                    </span>
                    <EditRingSize
                      productDetails={ringSizeShim}
                      onChange={handleRingSizeChange}
                      hideLabel
                      hideSizeGuide
                      className={`flex w-full items-center [&_.ant-select]:!w-full sm:[&_.ant-select]:!w-[180px] ${SELECT_SHELL}`}
                    />
                    <RingSizeChartModal open={isSizeChartOpen} onClose={() => setIsSizeChartOpen(false)} />
                  </div>
                )}
              </div>

              {gift.needs_ring_size && (
                <span className="flex items-center gap-1.5 text-[12px] text-danger" role="alert">
                  <LuInfo className="h-[13px] w-[13px] shrink-0" strokeWidth={2} />
                  Please choose a size to continue.
                </span>
              )}
            </div>
          )}

          {!readOnly && (
            <div className="mt-1 flex flex-wrap items-center gap-x-[18px] gap-y-1.5">
              <span className="flex items-center gap-2 text-[12.5px] text-ink-soft">
                <LuInfo className="h-[15px] w-[15px] shrink-0 text-ink" strokeWidth={1.6} />
                This is your free gift.
              </span>
              {/* Declining is a real choice — a shopper who does not want the ring should not have
                  to accept it to check out. It sits under the details rather than beside the price
                  so it cannot be mistaken for removing the paid line above. Checkout has no control
                  because the gift is settled in the cart, like the colour and the size. */}
              <button
                type="button"
                onClick={handleDecline}
                className="flex items-center gap-1 text-[11px] uppercase tracking-[0.12em] text-ink-soft underline underline-offset-4 hover:text-danger"
              >
                <LuX className="h-3 w-3 shrink-0" strokeWidth={2.2} />
                Remove
              </button>
            </div>
          )}
        </div>

        {/* Bag: a right-hand price column (its own line on a phone). Checkout: a compact column. */}
        <div
          className={`flex shrink-0 flex-col items-end gap-1 text-right tabular-nums ${
            readOnly ? '' : 'min-w-[90px] sm:basis-full sm:pl-[104px] sm:min-w-0 sm:flex-row sm:flex-wrap sm:items-baseline sm:gap-2.5 sm:text-left'
          }`}
        >
          {/* One statement of the price, not two — "$0" and "FREE" said the same thing. */}
          <strong className={`font-medium uppercase tracking-[0.14em] text-ink ${readOnly ? 'text-[12.5px]' : 'text-[15px]'}`}>Free</strong>
          {retailTotal > 0 && <s className="text-[12.5px] text-ink-soft">{formatCurrency(Math.ceil(retailTotal))}</s>}
          {retailTotal > 0 && (
            <small className="flex items-center gap-1 whitespace-nowrap text-[11.5px] text-gilt">
              <LuTag className="h-3 w-3 shrink-0" strokeWidth={1.8} />
              You save {formatCurrency(Math.ceil(retailTotal))}
            </small>
          )}
        </div>
      </div>

      {/* Checkout has no size picker to point at, so a missing size has to be called out
          here. In the cart the inline message under the picker does that job instead. */}
      {readOnly &&
        (gift.needs_ring_size ? (
          <p className="m-0 mt-2.5 flex items-start gap-2 text-[12px] text-danger" role="alert">
            <LuInfo className="mt-[2px] h-[14px] w-[14px] shrink-0" strokeWidth={1.8} />
            Please return to the cart and choose a ring size for your free gift.
          </p>
        ) : (
          <p className="m-0 mt-2.5 flex items-center gap-2 text-[12px] text-ink-soft">
            <LuInfo className="h-[14px] w-[14px] shrink-0 text-ink" strokeWidth={1.6} />
            This is your free gift.
          </p>
        ))}
    </div>
  );
}
