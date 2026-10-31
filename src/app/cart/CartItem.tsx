'use client';
import React, { useEffect, useState } from 'react';

import dayjs from 'dayjs';
import Link from 'next/link';
import { LuTruck } from 'react-icons/lu';

import EditEngraving from '@/components/CartProductDetails/EditEngraving';
import EditRingSize from '@/components/CartProductDetails/EditRingSize';
import { setSelectedAppraisal, setSelectedEngraving, setSelectedWarranty, useAppDispatch, useAppSelector } from '@/store';
import { formatCurrency } from '@/utils/common';

interface Props {
  index: number;
  productDetails: any;
  handleRemoveProducts: (productDetails: any, index: number) => void;
  handleCount: (values: any) => void;
  /** (item, RingSizePricing row id, display size e.g. "7") — edits the ring size of this line in place. */
  handleUpdateRingSize?: (item: any, ringSizeId: string | number | null, ringSizeLabel?: string) => void | Promise<void>;
  /** Adds, edits or clears (empty Text) the engraving of this line in place. */
  handleUpdateEngraving?: (item: any, engravingText: { Text: string; fontFamily: string }) => void | Promise<void>;
}

const LINK = 'text-[11px] uppercase tracking-[0.12em] text-ink-soft underline underline-offset-4 hover:text-ink';

/** One piece in the bag: image, specs, add-ons, quantity and price (design: design-mockups/cart). */
export default function CartItem({
  index,
  productDetails: item,
  handleRemoveProducts,
  handleCount,
  handleUpdateRingSize,
  handleUpdateEngraving,
}: Props) {
  const dispatch = useAppDispatch();
  const master = useAppSelector((state) => state.master.data);
  const { appraisalData, engraving }: any = useAppSelector((state) => state?.master);
  const [count, setCount] = useState<number>(item?.count ?? 1);

  useEffect(() => {
    setCount(item?.count ?? 1);
  }, [item]);

  const name = (id: string | undefined) => (id ? master?.find((m: any) => m.id === id)?.name : undefined);
  const sku = item?.jewelry_sku;
  const diamondKey = sku?.center_diamond_id ?? sku?.accent_diamond_id ?? sku?.second_accent_diamond_id ?? sku?.metal_id;
  const stoneGroup = master?.find((el: any) => el?.id === diamondKey)?.group;

  // Link back to the product page with the chosen options (unchanged from the previous cart).
  const typeSlug = item?.cartJewelryDetails?.jewelrySubType?.parent_code?.toLowerCase()?.replace('_', '-');
  const yearValue = item?.selectedYearValue?.year ?? item?.warranty_year;
  const isCustom = item?.cartJewelryDetails?.is_customizable;
  const baseHref = isCustom
    ? `/custom-jewelry?type=2&did=${item?.diamondDetails?.id}&state=c&id=${sku?.sku_slug}`
    : `/${typeSlug}/premade?slug=${sku?.sku_slug}&appraisal=${item?.is_appraisal}&warranty=${item?.is_warranty}`;
  const href = !isCustom && yearValue ? `${baseHref}&year=${yearValue}` : baseHref;
  const rememberOptions = () => {
    dispatch(setSelectedAppraisal(item?.is_appraisal ? { ...appraisalData } : null));
    dispatch(
      setSelectedWarranty({
        warrantyName: `${item?.warranty_year} ${item?.warranty_amount}`,
        yearPrice: { year: item?.warranty_year, price: item?.warranty_amount },
      }),
    );
    dispatch(setSelectedEngraving({ fontFamily: item?.engravingText?.fontFamily, text: item?.engravingText?.Text }));
  };

  // Prices
  const ringRate = item?.ringSizePricingDetails?.rate ?? 0;
  const appraisalPrice = item?.is_appraisal ? appraisalData?.price || 0 : 0;
  const warrantyPrice = item?.selectedYearValue?.price ?? item?.warranty_amount ?? 0;
  const hasEngraving = Boolean(item?.engravingText && item?.engravingText.Text != '');
  const engravingPrice = hasEngraving ? engraving?.data?.engraving_price || 0 : 0;
  const extras = ringRate + appraisalPrice + warrantyPrice + engravingPrice;
  const unit = Math.ceil((sku?.selling_price ?? 0) + extras);
  const unitSale = sku?.discounted_price ? Math.ceil(sku.discounted_price + extras) : null;
  const diamondPrice = item?.diamondDetails ? Number(item.diamondDetails.price) || 0 : 0;
  const lineTotal = (unitSale ?? unit) * count + diamondPrice;

  // Ring size / engraving are editable in the bag for any sized ring / engraving-enabled product,
  // including custom jewelry — driven by whether the line carries a ring-size pricing row /
  // has engraving enabled.
  const canEditRingSize = Boolean(item?.ringSizePricingDetails) && Boolean(handleUpdateRingSize);
  const canEditEngraving = Boolean(item?.cartJewelryDetails?.is_engraving) && Boolean(handleUpdateEngraving);

  const spec = [name(sku?.metal_type_id), name(sku?.metal_color_id), stoneGroup].filter(Boolean);
  const details = [
    item?.ringSizePricingDetails && !canEditRingSize ? `Ring size ${name(item?.ringSizePricingDetails?.ring_size_id) ?? ''}` : null,
    sku?.bracelet_length_ids ? `Length ${name(sku?.bracelet_length_ids)} in` : null,
    sku?.band_width_ids ? `Band width ${name(sku?.band_width_ids)} mm` : null,
  ].filter(Boolean);
  const addons = [
    hasEngraving
      ? {
          label: 'Engraving',
          // The editable chip below already shows the engraved text.
          note: canEditEngraving ? null : (
            <q className="font-cormorant text-[16px] italic text-ink" style={{ fontFamily: item?.engravingText?.fontFamily }}>
              {item?.engravingText?.Text}
            </q>
          ),
          price: engravingPrice,
        }
      : null,
    item?.is_appraisal ? { label: 'Independent appraisal', note: 'Insurance valuation document', price: appraisalPrice } : null,
    item?.selectedYearValue || item?.is_warranty
      ? { label: 'Extended warranty', note: `${item?.selectedYearValue?.year ?? item?.warranty_year} year cover`, price: warrantyPrice }
      : null,
  ].filter(Boolean) as { label: string; note: React.ReactNode; price: number }[];

  const shipDays = Number(item?.cartJewelryDetails?.estimated_delivery_days);
  const setQty = (next: number) => {
    setCount(next);
    handleCount({ sku_master_id: item?.sku_master_id, count: next, id: item?.id, ring_size_id: item?.ringSizePricingDetails?.id ?? null });
  };

  return (
    <li className="grid grid-cols-[clamp(104px,12vw,148px)_minmax(0,1fr)_auto] gap-[clamp(16px,2.4vw,32px)] border-b border-line py-7 sm:grid-cols-[88px_minmax(0,1fr)] sm:gap-x-4 sm:gap-y-2.5">
      <Link href={href} onClick={rememberOptions} className="relative block aspect-[4/5] overflow-hidden bg-stone sm:row-span-2">
        <img
          src={sku?.carat_images?.[0] || '/images/no_images.svg'}
          alt={item?.fullTitle ?? 'Product'}
          loading="lazy"
          className="h-full w-full object-contain mix-blend-multiply"
        />
      </Link>

      <div className="grid min-w-0 content-start gap-2.5">
        <h3 className="m-0 font-cormorant text-[25px] font-medium leading-[1.1] text-ink sm:text-[21px]">
          <Link href={href} onClick={rememberOptions} className="text-ink hover:text-gilt">
            {item?.fullTitle}
          </Link>
        </h3>
        {spec.length > 0 && <p className="m-0 text-[13px] text-ink-soft">{spec.join(' · ')}</p>}
        {details.length > 0 && <p className="m-0 text-[12px] text-ink-soft">{details.join(' · ')}</p>}

        {item?.diamondDetails && (
          <div className="flex items-center gap-3 border-y border-dashed border-line py-3 text-[12.5px]">
            <img
              src={
                master?.find((m: any) => m?.name === item?.diamondDetails?.shape_name && m?.parent_code == 'SHAPE')?.image?.[0] ||
                '/images/no_images.svg'
              }
              alt={item?.diamondDetails?.shape_name ?? ''}
              className="h-8 w-8 object-contain"
            />
            <div className="min-w-0 flex-1">
              <span className="block text-ink">{item?.diamondDetails?.fullTitle}</span>
              <span className="text-ink-soft">
                {[
                  item?.diamondDetails?.shape_name,
                  `${item?.diamondDetails?.col} color`,
                  `${item?.diamondDetails?.clr} clarity`,
                  item?.diamondDetails?.diamond_type == 2 ? 'Lab-grown' : 'Natural',
                ].join(' · ')}
              </span>
            </div>
            <span className="tabular-nums">{formatCurrency(diamondPrice)}</span>
          </div>
        )}

        {(canEditRingSize || canEditEngraving) && (
          <div className="grid gap-1">
            {canEditRingSize && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">Ring size</span>
                <EditRingSize
                  productDetails={item}
                  hideLabel
                  className="flex flex-wrap items-center gap-x-3 gap-y-1.5"
                  onChange={(ringSizeId, ringSizeLabel) => handleUpdateRingSize?.(item, ringSizeId, ringSizeLabel)}
                />
              </div>
            )}
            {canEditEngraving && <EditEngraving productDetails={item} onSave={(engravingText) => handleUpdateEngraving?.(item, engravingText)} />}
          </div>
        )}

        <div className="mt-1 flex flex-wrap items-end gap-3">
          {!item?.diamondDetails && (
            <div className="grid gap-1.5">
              <span className="text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">Quantity</span>
              <div className="inline-flex h-10 items-center border border-line" role="group" aria-label="Quantity">
                <button
                  type="button"
                  aria-label="Decrease quantity"
                  disabled={count <= 1}
                  onClick={() => setQty(count - 1)}
                  className="grid h-full w-9 place-items-center text-base hover:bg-stone disabled:cursor-not-allowed disabled:text-line-strong disabled:hover:bg-transparent"
                >
                  −
                </button>
                <output className="min-w-7 text-center text-[13px] tabular-nums">{count}</output>
                <button
                  type="button"
                  aria-label="Increase quantity"
                  onClick={() => setQty(count + 1)}
                  className="grid h-full w-9 place-items-center text-base hover:bg-stone"
                >
                  +
                </button>
              </div>
            </div>
          )}
        </div>

        {addons.length > 0 && (
          <div className="mt-2.5 grid border-t border-line">
            {addons.map((a) => (
              <div
                key={a.label}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3.5 border-b border-dashed border-line py-3 last:border-b-0"
              >
                <div className="text-[13px]">
                  {a.label} <span className="block text-[12px] text-ink-soft">{a.note}</span>
                </div>
                <span className="text-[12.5px] tabular-nums text-ink-soft">+{formatCurrency(a.price)}</span>
              </div>
            ))}
          </div>
        )}

        {shipDays > 0 && (
          <p className="m-0 mt-0.5 flex items-center gap-2.5 text-[12.5px] text-ink-soft">
            <LuTruck className="h-[18px] w-[18px] text-ink" aria-hidden />
            Ships by <b className="font-medium text-ink">{dayjs().add(shipDays, 'day').format('ddd D MMM')}</b>
          </p>
        )}

        <div className="mt-1 flex flex-wrap gap-[18px]">
          {addons.length > 0 && (
            <Link href={href} onClick={rememberOptions} className={LINK}>
              Edit options
            </Link>
          )}
          <button type="button" className={LINK} onClick={() => handleRemoveProducts(item, index)}>
            Remove
          </button>
        </div>
      </div>

      <div className="grid min-w-[90px] content-start gap-1 text-right tabular-nums sm:col-start-2 sm:flex sm:min-w-0 sm:flex-wrap sm:items-baseline sm:gap-2.5 sm:text-left">
        <strong className="text-[15px] font-medium">{formatCurrency(lineTotal)}</strong>
        {unitSale && <s className="text-[12.5px] text-ink-soft">{formatCurrency(unit * count + diamondPrice)}</s>}
        {count > 1 && (
          <small className="text-[11.5px] text-ink-soft">
            {count} × {formatCurrency(unitSale ?? unit)}
          </small>
        )}
      </div>
    </li>
  );
}
