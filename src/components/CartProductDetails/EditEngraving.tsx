'use client';

import React, { useEffect, useState } from 'react';

import { Button, Input, Modal, Select } from 'antd';
import { FiEdit2, FiPlus, FiTrash2 } from 'react-icons/fi';

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
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5">
      <span className="text-[12px] font-medium tracking-[0.20px] text-slate-500">Engraving:</span>
      {hasEngraving ? (
        // Segmented box: [ text | edit | delete ] — each segment visually separated so
        // the engraved text and the two icon actions are clearly distinguishable.
        <span className="inline-flex max-w-full items-stretch overflow-hidden rounded-md border border-gray-300 bg-white text-[13px] sm:text-[12px]">
          <span
            className="flex max-w-[150px] items-center truncate bg-[#faf9f7] px-3.5 py-2 font-semibold text-[#1a1a2e]"
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
            className="flex items-center border-l border-gray-200 px-3 py-2 text-[#2f6f4e] transition-colors hover:bg-[#2f6f4e]/10"
          >
            <FiEdit2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleRemove}
            disabled={saving}
            aria-label="Remove engraving"
            title="Remove engraving"
            className="flex items-center border-l border-gray-200 px-3 py-2 text-[#c0392b] transition-colors hover:bg-[#c0392b]/10"
          >
            <FiTrash2 className="h-4 w-4" />
          </button>
        </span>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex w-fit items-center gap-1.5 rounded-md border border-dashed border-secondary/60 px-3 py-1 text-[13px] font-light tracking-[0.3px] text-secondary hover:bg-secondary/5 sm:text-[12px]"
        >
          <FiPlus className="h-4 w-4" />
          Add Engraving
        </button>
      )}

      <Modal open={open} onCancel={() => setOpen(false)} footer={null} title={null} centered destroyOnClose width={440} zIndex={10050}>
        <div className="!font-sans flex flex-col gap-4 pt-1">
          {/* Heading */}
          <div>
            <p className="text-[17px] font-medium text-[#1a1a1a]">Enter Your Engraving</p>
            <p className="mt-0.5 text-[13px] text-secondary">{`Add engraving (${formatCurrency(engravingPrice)})`}</p>
          </div>

          {/* Text */}
          <div>
            <Input
              size="large"
              placeholder="Engrave Text"
              maxLength={ENGRAVING_MAX_LENGTH}
              value={text}
              style={{ fontFamily }}
              onChange={(e) => setText(e.target.value)}
            />
            <p className="mt-1 text-right text-[12px] text-slate-400">Characters Left: {charsLeft}</p>
          </div>

          {/* Font dropdown */}
          <div>
            <p className="mb-1.5 text-[13px] font-medium text-[#1a1a1a]">Choose Font</p>
            <Select
              size="large"
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
            <p className="mb-1.5 text-[13px] font-medium text-[#1a1a1a]">Engraving Preview</p>
            <div className="flex min-h-[76px] items-center justify-center rounded-md border border-[#ececec] bg-[#f8f8f8] px-4 py-3">
              <span className="break-all text-[22px] text-[#1a1a1a]" style={{ fontFamily }}>
                {text || 'Your text'}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2">
            {hasEngraving && (
              <Button danger onClick={handleRemove} disabled={saving} className="!h-[38px]">
                Remove
              </Button>
            )}
            <Button
              type="default"
              onClick={handleSave}
              loading={saving}
              className="!bg-secondary !text-text_w !h-[38px] px-6 tracking-[1px] uppercase"
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default EditEngraving;
