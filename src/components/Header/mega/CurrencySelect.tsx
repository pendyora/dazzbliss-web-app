'use client';

import React from 'react';

import { Select } from 'antd';

interface Props {
  currency: string;
  /** `value` is the country row's id (several countries can share one currency code); `code`/`symbol` ride along. */
  currencyOption: { label: React.ReactNode; value: string; code?: string; symbol?: string }[];
  setCurrency: (value: string) => void;
  setRefresh: (value: boolean) => void;
  /** `dark` sits on the noir announcement bar, `light` in the mobile drawer. */
  tone: 'dark' | 'light';
}

/** Currency picker. Changing it stores the choice and reloads so prices refetch (unchanged behaviour). */
export default function CurrencySelect({ currency, currencyOption, setCurrency, setRefresh, tone }: Props) {
  if (!currency || currencyOption.length === 0) {
    return null;
  }

  const onChange = (value: string) => {
    // `value` is the country row's id, not the currency code — two countries can share a code,
    // so the id is what identifies the picked row. Persist the code and symbol alongside it for
    // formatCurrency and the rest of the app.
    const selected = currencyOption.find((item) => item?.value === value);
    if (!selected) {
      return;
    }
    localStorage.setItem('currencySymbol', selected.symbol ?? '');
    localStorage.setItem('currency', selected.code ?? '');
    localStorage.setItem('currencyCountryId', selected.value);
    setCurrency(value);
    setRefresh(true);
  };

  return (
    <Select
      variant="borderless"
      size="small"
      aria-label="Currency"
      value={currency}
      onChange={onChange}
      popupMatchSelectWidth={false}
      options={currencyOption}
      className={`!w-auto min-w-[78px] [&_.ant-select-selection-item]:!text-[11px] [&_.ant-select-selection-item]:tracking-[0.16em] ${
        tone === 'dark'
          ? '[&_.ant-select-arrow]:!text-noir-on [&_.ant-select-selection-item]:!text-noir-on'
          : '[&_.ant-select-arrow]:!text-ink [&_.ant-select-selection-item]:!text-ink'
      }`}
    />
  );
}
