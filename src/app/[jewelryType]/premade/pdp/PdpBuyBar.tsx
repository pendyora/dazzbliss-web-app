'use client';
import React from 'react';

import { Button } from 'antd';

interface PdpBuyBarProps {
  title: string;
  /** Selected options, e.g. "18K Yellow Gold · Round". */
  summary?: string;
  image?: string;
  price: React.ReactNode;
  /** True once the main add-to-bag button has scrolled away (and the footer is not on screen). */
  visible: boolean;
  onBuy: () => void;
  buyLabel: string;
  loading?: boolean;
}

const BUY_BTN = '!border-ink !bg-ink !text-[11.5px] !font-semibold !uppercase !tracking-[0.18em] !text-paper hover:!bg-ink-hover';

/**
 * Keeps "Add to bag" in reach once the main button scrolls away (design-mockups/product-page-v4):
 * a slim bar under the site header on desktop, a bottom bar on mobile.
 */
export default function PdpBuyBar({ title, summary, image, price, visible, onBuy, buyLabel, loading }: PdpBuyBarProps) {
  return (
    <>
      <div
        aria-hidden={!visible}
        className={`fixed inset-x-0 top-[var(--header-height,72px)] z-30 border-b border-line bg-paper shadow-[0_10px_30px_-20px_rgba(0,0,0,0.25)] transition-[transform,visibility] duration-[350ms] ease-luxe md:hidden ${
          visible ? 'visible translate-y-0' : 'invisible -translate-y-[110%]'
        }`}
      >
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-[clamp(16px,3.2vw,56px)]">
          {image && <img src={image} alt="" className="h-11 w-11 flex-none bg-stone object-contain mix-blend-multiply" />}
          <div className="grid min-w-0">
            <b className="truncate text-[14px] font-medium text-ink">{title}</b>
            {summary && <span className="truncate text-[13px] text-ink-soft">{summary}</span>}
          </div>
          <span className="ml-6 text-[16px] tabular-nums text-ink">{price}</span>
          <Button type="primary" onClick={onBuy} loading={loading} tabIndex={visible ? 0 : -1} className={`!ml-auto !h-11 !px-7 ${BUY_BTN}`}>
            {buyLabel}
          </Button>
        </div>
      </div>

      <div
        className={`fixed inset-x-0 bottom-0 z-40 hidden items-center gap-3.5 border-t border-line bg-paper px-4 pb-[calc(10px+env(safe-area-inset-bottom,0px))] pt-2.5 shadow-[0_-12px_40px_theme(colors.ink.DEFAULT/6%)] transition-transform duration-500 ease-luxe md:flex ${
          visible ? 'translate-y-0' : 'translate-y-[110%]'
        }`}
        aria-hidden={!visible}
      >
        <div className="grid min-w-0 flex-1">
          <span className="text-[16px] font-medium leading-tight tabular-nums text-ink">{price}</span>
          <span className="truncate text-[12px] text-ink-soft">{summary || title}</span>
        </div>
        <Button type="primary" onClick={onBuy} loading={loading} tabIndex={visible ? 0 : -1} className={`!h-12 !px-6 ${BUY_BTN}`}>
          {buyLabel}
        </Button>
      </div>
    </>
  );
}
