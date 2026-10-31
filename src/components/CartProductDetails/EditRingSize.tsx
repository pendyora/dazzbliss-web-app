'use client';

import React, { useMemo, useState } from 'react';

import { Select } from 'antd';
import { PiRuler } from 'react-icons/pi';

import RingSizeChartModal from '@/app/[jewelryType]/premade/RingSizeChartModal';
import { useAppSelector } from '@/store';
import { formatCurrency } from '@/utils/common';

interface EditRingSizeProps {
  productDetails: any;
  // (ringSizeId = RingSizePricing row id, ringSizeLabel = display size e.g. "7")
  onChange: (ringSizeId: string | number, ringSizeLabel: string) => void | Promise<void>;
  /** Hide the inline "Ring Size:" caption when the surrounding layout already labels it. */
  hideLabel?: boolean;
  /** Hide the Size Guide link when the surrounding layout has no room for it. */
  hideSizeGuide?: boolean;
  /** Extra classes for the wrapper, so a host can control its own spacing. */
  className?: string;
}

// Inline, editable ring-size selector for a cart line. Mirrors the PDP option list
// but resolves the price row by (ring_size + metal_type) so the id we send to the
// backend is always metal-correct.
const EditRingSize: React.FC<EditRingSizeProps> = ({ productDetails, onChange, hideLabel = false, hideSizeGuide = false, className }) => {
  const productFilter = useAppSelector((state) => state?.master?.data);
  const masterRingSizePrice = useAppSelector((state) => state?.master?.ringSizePriceList);
  const [isChartOpen, setIsChartOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const metalTypeId = productDetails?.jewelry_sku?.metal_type_id;
  const genderCategory = productDetails?.cartJewelryDetails?.gender_category;
  const currentRingSizeRowId = productDetails?.ringSizePricingDetails?.id;

  const options = useMemo(() => {
    if (!metalTypeId || !Array.isArray(masterRingSizePrice)) {
      return [];
    }
    return masterRingSizePrice
      .filter((el: any) => el?.metal_type_id == metalTypeId && (genderCategory == 2 ? el?.is_men : el?.is_women))
      .map((el: any) => {
        const master = productFilter?.find((r: any) => r?.parent_code === 'RING_SIZE' && r?.id === el?.ring_size_id);
        return { priceRowId: el?.id, name: master?.name, rate: Number(el?.rate) || 0 };
      })
      .filter((o: any) => o?.name != null)
      .sort((a: any, b: any) => Number(a.name) - Number(b.name))
      .map((o: any) => ({
        value: o.priceRowId,
        name: o.name,
        label: (
          <div className="flex w-full items-center justify-between gap-2">
            <span>{o.name}</span>
            {o.rate > 0 && <span className="text-slate-400">{`+${formatCurrency(o.rate)}`}</span>}
          </div>
        ),
      }));
  }, [masterRingSizePrice, productFilter, metalTypeId, genderCategory]);

  const handleChange = async (value: string | number) => {
    const picked = options.find((o: any) => o.value === value);
    if (!picked) {
      return;
    }
    try {
      setUpdating(true);
      await onChange(value, picked.name);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div
      className={
        className ??
        'mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 sm:flex-nowrap sm:gap-x-2 ' + 'sm:[&_.ant-select]:!min-w-0 sm:[&_.ant-select]:!w-[68px]'
      }
    >
      {!hideLabel && <span className="shrink-0 text-[12px] font-medium tracking-[0.20px] text-slate-500">Ring Size:</span>}
      <Select
        loading={updating}
        value={currentRingSizeRowId ?? undefined}
        options={options}
        onChange={handleChange}
        className={
          '!min-w-[96px] sm:[&_.ant-select-selector]:!px-2 sm:[&_.ant-select-arrow]:!right-2 ' +
          'sm:[&_.ant-select-selection-item]:!pe-3 sm:[&_.ant-select-selection-placeholder]:!pe-3'
        }
        popupMatchSelectWidth={false}
        placeholder="Select size"
      />
      {!hideSizeGuide && (
        <button
          type="button"
          onClick={() => setIsChartOpen(true)}
          className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[12px] text-secondary underline underline-offset-2 hover:opacity-80"
        >
          <PiRuler className="h-4 w-4" />
          Size Guide
        </button>
      )}
      <RingSizeChartModal open={isChartOpen} onClose={() => setIsChartOpen(false)} />
    </div>
  );
};

export default EditRingSize;
