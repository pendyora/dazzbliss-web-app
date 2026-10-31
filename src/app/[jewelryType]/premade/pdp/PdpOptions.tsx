'use client';
import React from 'react';

import { Tooltip } from 'antd';

import { METAL_SWATCH } from '@/components/ProductProfile/PlpCard';
import type { MetalTone } from '@/utils/metalTone';

const FALLBACK_IMAGE = '/images/no_images.svg';

export function OptionGroup({
  label,
  value,
  aside,
  children,
}: {
  label: string;
  value?: React.ReactNode;
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-2.5">
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-semibold text-ink">
          {label}
          {value && <span className="ml-1.5 font-normal text-ink-soft">{value}</span>}
        </span>
        {aside}
      </div>
      {children}
    </div>
  );
}

/** Text choice (metal karat, carat weight, length, band width). */
export function ChoiceChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-[48px] min-w-[64px] border px-4 text-[13.5px] tabular-nums transition-colors duration-300 ease-luxe ${
        active ? 'border-ink text-ink shadow-[inset_0_0_0_0.5px_theme(colors.ink.DEFAULT)]' : 'border-line-strong text-ink hover:border-ink'
      }`}
    >
      {children}
    </button>
  );
}

/** Round metal-colour swatch, matching the PLP card swatches. */
export function MetalSwatch({ active, tone, label, onClick }: { active: boolean; tone: MetalTone; label: string; onClick: () => void }) {
  return (
    <Tooltip title={label}>
      <button
        type="button"
        aria-pressed={active}
        aria-label={label}
        onClick={onClick}
        className={`grid h-10 w-10 place-items-center rounded-full border transition-colors duration-300 ${
          active ? 'border-ink' : 'border-transparent hover:border-line-strong'
        }`}
      >
        <span className={`block h-8 w-8 rounded-full shadow-[inset_0_0_0_1px_theme(colors.ink.DEFAULT/8%)] ${METAL_SWATCH[tone]}`} />
      </button>
    </Tooltip>
  );
}

/** Image swatch for shapes, stone colours and diamond colours. */
export function ImageSwatch({
  active,
  src,
  label,
  onClick,
  round = false,
}: {
  active: boolean;
  src?: string;
  label: string;
  onClick?: () => void;
  round?: boolean;
}) {
  return (
    <Tooltip title={label}>
      <button
        type="button"
        aria-pressed={active}
        aria-label={label}
        onClick={onClick}
        disabled={!onClick}
        className={`grid h-12 w-12 place-items-center border p-1 transition-colors duration-300 disabled:cursor-default ${round ? 'rounded-full' : ''} ${
          active ? 'border-ink' : 'border-line hover:border-ink-soft'
        }`}
      >
        <img
          src={src || FALLBACK_IMAGE}
          alt=""
          loading="lazy"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith(FALLBACK_IMAGE)) {
              e.currentTarget.src = FALLBACK_IMAGE;
            }
          }}
          className={`h-full w-full object-contain ${round ? 'rounded-full object-cover' : ''} ${active ? '' : 'opacity-80'}`}
        />
      </button>
    </Tooltip>
  );
}
