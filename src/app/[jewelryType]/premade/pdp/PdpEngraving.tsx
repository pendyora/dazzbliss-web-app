'use client';
import React, { useState } from 'react';

import { Checkbox, Input, Select } from 'antd';

import { ENGRAVING_MAX_LENGTH } from '@/constants/app.constant';
import { setSelectedEngraving, useAppDispatch, useAppSelector } from '@/store';
import { formatCurrency } from '@/utils/common';

const FONTS = ['Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana', 'Roboto', 'Lobster'];

interface EngravingValue {
  Text: string;
  fontFamily: string;
}

/** Engraving option for the PDP. Same state contract as Components/Engraving (used by the custom-jewelry flow). */
export default function PdpEngraving({
  engravingText,
  setEngravingText,
}: {
  engravingText: EngravingValue;
  setEngravingText: (value: EngravingValue) => void;
}) {
  const dispatch = useAppDispatch();
  const { engraving }: any = useAppSelector((state) => state?.master);
  const [open, setOpen] = useState(Boolean(engravingText?.Text));
  const price = engraving?.data?.engraving_price;

  const update = (next: EngravingValue) => {
    setEngravingText(next);
    dispatch(next.Text ? setSelectedEngraving({ text: next.Text, fontFamily: next.fontFamily }) : setSelectedEngraving(null));
  };

  return (
    <div className="grid gap-3">
      <Checkbox
        checked={open}
        onChange={(e) => {
          setOpen(e.target.checked);
          if (!e.target.checked) {
            update({ Text: '', fontFamily: engravingText.fontFamily });
          }
        }}
      >
        <span className="text-[13px] text-ink-soft">
          Add a personal engraving inside the band{price ? <span className="text-ink"> (+{formatCurrency(price)})</span> : null}
        </span>
      </Checkbox>
      {open && (
        <div className="grid gap-3 bg-stone/60 p-4">
          <div className="grid grid-cols-[minmax(0,1fr)_160px] gap-2 sm:grid-cols-1">
            <Input
              id="pdp-engraving-text"
              placeholder="Your words, e.g. Always · A & R"
              maxLength={ENGRAVING_MAX_LENGTH}
              showCount
              value={engravingText.Text ?? ''}
              onChange={(e) => update({ Text: e.target.value.trim(), fontFamily: engravingText.fontFamily })}
              style={{ fontFamily: engravingText.fontFamily }}
              aria-label="Engraving text"
            />
            <Select
              value={engravingText.fontFamily || 'Arial'}
              onChange={(fontFamily: string) => update({ Text: engravingText.Text, fontFamily })}
              options={FONTS.map((font) => ({ value: font, label: <span style={{ fontFamily: font }}>{font}</span> }))}
              aria-label="Engraving font"
            />
          </div>
          <p className="m-0 min-h-[1.6em] text-center text-[20px] text-gilt" style={{ fontFamily: engravingText.fontFamily }} aria-live="polite">
            {engravingText.Text}
          </p>
        </div>
      )}
    </div>
  );
}
