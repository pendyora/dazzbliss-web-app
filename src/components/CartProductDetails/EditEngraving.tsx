'use client';

import React, { useEffect, useState } from 'react';

import { Button, ConfigProvider, Input, Modal, Select } from 'antd';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';

import { checkoutTheme, PRIMARY_BTN, SECONDARY_BTN } from '@/app/checkout/checkoutTheme';
import { ENGRAVING_MAX_LENGTH } from '@/constants/app.constant';
import { useAppSelector } from '@/store';
import { formatCurrency } from '@/utils/common';

const FONT_LIST = ['Arial', 'Times New Roman', 'Georgia', 'Courier New', 'Verdana', 'Roboto', 'Lobster'];

interface EditEngravingProps {
  productDetails: any;
  onSave: (engravingText: { Text: string; fontFamily: string }) => void | Promise<void>;
}

// Engraving control for a single cart line: a compact chip when engraving exists
// (click the text to edit, "×" to remove), otherwise an "Add Engraving" link,
// plus the edit modal. Shown only when the product has engraving enabled.
const EditEngraving: React.FC<EditEngravingProps> = ({ productDetails, onSave }) => {
  const { engraving }: any = useAppSelector((state) => state?.master);
  const engravingPrice = engraving?.data?.engraving_price ?? 0;

  const existing = productDetails?.engravingText;
  const hasEngraving = Boolean(existing?.Text && existing?.Text !== '');

  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string>('');
  const [fontFamily, setFontFamily] = useState<string>('Arial');
  const [saving, setSaving] = useState(false);

  // Seed the modal from the current cart values each time it opens.
  useEffect(() => {
    if (open) {
      setText(existing?.Text ?? '');
      setFontFamily(existing?.fontFamily || 'Arial');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const charsLeft = ENGRAVING_MAX_LENGTH - text.length;

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave({ Text: text.trim(), fontFamily });
      setOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async () => {
    try {
      setSaving(true);
      await onSave({ Text: '', fontFamily: existing?.fontFamily || 'Arial' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <ConfigProvider theme={checkoutTheme}>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1.5 font-libre">
        <span className="text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">Engraving</span>
        {hasEngraving ? (
          // Segmented box: [ text | edit | delete ] — each segment visually separated so
          // the engraved text and the two icon actions are clearly distinguishable.
          <span className="inline-flex h-10 max-w-full items-stretch border border-line text-[13px]">
            <span
              className="flex max-w-[180px] items-center truncate px-3.5 text-[15px] text-ink"
              style={{ fontFamily: existing?.fontFamily }}
              title={existing?.Text}
            >
              {existing?.Text}
            </span>
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="Edit engraving"
              title="Edit engraving"
              className="grid w-10 place-items-center border-l border-line text-ink-soft transition-colors hover:bg-stone hover:text-ink"
            >
              <FiEdit2 className="h-[15px] w-[15px]" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              disabled={saving}
              aria-label="Remove engraving"
              title="Remove engraving"
              className="grid w-10 place-items-center border-l border-line text-ink-soft transition-colors hover:bg-stone hover:text-danger disabled:cursor-not-allowed disabled:opacity-50"
            >
              <FiTrash2 className="h-[15px] w-[15px]" />
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex h-10 w-fit items-center gap-2 border border-dashed border-line-strong px-3.5 text-[11px] uppercase tracking-[0.12em] text-ink transition-colors hover:border-ink"
          >
            <FiPlus className="h-3.5 w-3.5" />
            Add Engraving
          </button>
        )}

        <Modal
          open={open}
          onCancel={() => setOpen(false)}
          footer={null}
          title={null}
          centered
          destroyOnClose
          width={460}
          zIndex={10050}
          classNames={{ content: '!rounded-none !px-7 !py-7 sm:!px-5' }}
        >
          <div className="flex flex-col gap-5 font-libre text-ink">
            {/* Heading */}
            <div>
              <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">Personalise</span>
              <p className="m-0 mt-1.5 font-cormorant text-[30px] font-normal leading-none text-ink">Enter Your Engraving</p>
              <p className="m-0 mt-2 text-[13px] text-ink-soft">{`Add engraving (${formatCurrency(engravingPrice)})`}</p>
            </div>

            {/* Text */}
            <div>
              <Input
                placeholder="Engrave Text"
                maxLength={ENGRAVING_MAX_LENGTH}
                value={text}
                style={{ fontFamily }}
                onChange={(e) => setText(e.target.value)}
              />
              <p className="m-0 mt-1.5 text-right text-[11px] text-ink-soft">Characters Left: {charsLeft}</p>
            </div>

            {/* Font dropdown */}
            <div>
              <p className="m-0 mb-1.5 text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">Choose Font</p>
              <Select
                className="w-full"
                value={fontFamily}
                onChange={(value) => setFontFamily(value)}
                style={{ fontFamily }}
                options={FONT_LIST.map((font) => ({
                  value: font,
                  label: <span style={{ fontFamily: font }}>{font}</span>,
                }))}
              />
            </div>

            {/* Preview */}
            <div>
              <p className="m-0 mb-1.5 text-[10.5px] uppercase tracking-[0.16em] text-ink-soft">Engraving Preview</p>
              <div className="flex min-h-[84px] items-center justify-center bg-stone px-4 py-3">
                <span className="break-all text-[22px] text-ink" style={{ fontFamily }}>
                  {text || 'Your text'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 sm:flex-col-reverse sm:items-stretch">
              {hasEngraving && (
                <Button onClick={handleRemove} disabled={saving} className={SECONDARY_BTN}>
                  Remove
                </Button>
              )}
              <Button type="default" onClick={handleSave} loading={saving} className={PRIMARY_BTN}>
                Save
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </ConfigProvider>
  );
};

export default EditEngraving;
