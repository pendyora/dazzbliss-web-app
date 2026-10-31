'use client';
import React, { useEffect, useState } from 'react';

import { Checkbox, ConfigProvider, Drawer } from 'antd';
import { useLenis } from 'lenis/react';
import Link from 'next/link';
import { LuLoader } from 'react-icons/lu';

import themeColors from '@/styles/theme-colors';

export type FilterGroup = 'metal' | 'shape' | 'diamond_color' | 'subTypes' | 'specialTitle';
export type DrawerSection = 'category' | 'style' | 'metal' | 'price' | 'shape' | 'diamond_color' | 'carat' | 'specialTitle' | 'gender';

interface Option {
  id: string;
  name: string;
  image?: string;
}

export interface FilterPanelProps {
  loadingFilterId?: string | null;

  categories: { name: string; href: string; active: boolean; onClick?: () => void }[];
  styles: Option[];
  metals: Option[];
  shapes: Option[];
  diamondColors: Option[];
  specialTitles: Option[];
  selected: Record<FilterGroup, string[]>;
  onToggle: (group: FilterGroup, id: string) => void;

  gender: number;
  onGender: (value: number) => void;

  priceSlot: React.ReactNode;
  priceActive: boolean;
  caratSlot: React.ReactNode | null;
  caratActive: boolean;
}

interface FilterDrawerProps extends FilterPanelProps {
  open: boolean;
  focusSection: DrawerSection | null;
  onClose: () => void;
  resultCount: number;
  activeCount: number;
  onClearAll: () => void;
}

// Shared antd theme for the listing page; colors come from the Tailwind palette.
export const plpTheme = {
  token: {
    colorPrimary: themeColors.ink.DEFAULT,
    colorText: themeColors.ink.DEFAULT,
    colorBorder: themeColors.line.strong,
    borderRadiusSM: 0,
    borderRadius: 0,
    fontFamily: 'Libre Franklin, sans-serif',
  },
  components: {
    Slider: {
      railBg: themeColors.line.DEFAULT,
      railHoverBg: themeColors.line.strong,
      trackBg: themeColors.ink.DEFAULT,
      trackHoverBg: themeColors.ink.DEFAULT,
      handleColor: themeColors.ink.DEFAULT,
      handleActiveColor: themeColors.ink.DEFAULT,
      dotActiveBorderColor: themeColors.ink.DEFAULT,
      railSize: 2,
    },
    Select: {
      optionSelectedBg: themeColors.stone.DEFAULT,
      optionActiveBg: themeColors.paper,
      optionSelectedFontWeight: 600,
      optionFontSize: 13,
    },
    InputNumber: {
      activeBorderColor: themeColors.ink.DEFAULT,
      hoverBorderColor: themeColors.ink.DEFAULT,
    },
  },
};

// Smaller tags for the desktop rail.
const railTagClass = (active: boolean) =>
  `inline-flex min-h-[32px] items-center border px-3 text-[12.5px] transition-colors ${
    active ? 'border-ink bg-ink text-paper hover:text-paper' : 'border-line text-ink hover:border-ink hover:text-ink'
  }`;

const tagClass = (active: boolean) =>
  `inline-flex min-h-[42px] items-center border px-4 text-[11px] uppercase tracking-[0.14em] transition-colors ${
    active ? 'border-ink bg-ink text-paper hover:text-paper' : 'border-line text-ink hover:border-ink hover:text-ink'
  }`;

function Section({
  id,
  title,
  badge,
  open,
  onToggle,
  compact,
  children,
}: {
  id: DrawerSection;
  title: string;
  badge?: string;
  open: boolean;
  onToggle: () => void;
  compact?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section id={`plp-filter-${compact ? 'rail-' : ''}${id}`} className="border-b border-line">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className={`flex w-full items-center justify-between text-left ${compact ? 'py-4' : 'py-[22px]'}`}
      >
        <span className={compact ? 'text-[14px] font-medium text-ink' : 'font-cormorant text-[22px] font-medium text-ink'}>{title}</span>
        {badge && <small className="ml-auto mr-4 text-[11px] uppercase tracking-[0.1em] text-gilt">{badge}</small>}
        <span
          aria-hidden
          className={`relative h-3 w-3 flex-none before:absolute before:inset-x-0 before:top-1/2 before:h-px before:bg-ink before:content-[''] after:absolute after:inset-x-0 after:top-1/2 after:h-px after:bg-ink after:transition-transform after:content-[''] ${
            open ? 'after:rotate-0' : 'after:rotate-90'
          }`}
        />
      </button>
      {open && <div className={compact ? 'pb-4' : 'pb-[22px]'}>{children}</div>}
    </section>
  );
}

/** The filter sections. Rendered as the left rail on desktop (`compact`) and inside the drawer on smaller screens. */
export function FilterPanel({
  compact,
  onNavigate,
  loadingFilterId,
  categories,
  styles,
  metals,
  shapes,
  diamondColors,
  specialTitles,
  selected,
  onToggle,
  gender,
  onGender,
  priceSlot,
  priceActive,
  caratSlot,
  caratActive,
}: FilterPanelProps & { compact?: boolean; onNavigate?: () => void }) {
  const [openSections, setOpenSections] = useState<Set<DrawerSection>>(new Set(['metal', 'price', 'style']));

  const toggleSection = (id: DrawerSection) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

  const countBadge = (n: number) => (n > 0 ? `${n} selected` : undefined);

  const optionList = (group: FilterGroup, options: Option[], withImage = false) => (
    <div className="grid gap-1">
      {options.map((item) => {
        const checked = selected[group]?.includes(item.id);
        return (
          <Checkbox key={item.id} checked={checked} onChange={() => onToggle(group, item.id)} className="!items-center !py-[7px] !text-[13.5px]">
            <span className="flex items-center gap-3">
              {withImage && item.image && (
                <span className="grid h-[22px] w-[22px] place-items-center overflow-hidden rounded-full bg-stone">
                  <img src={item.image} alt="" className="h-full w-full object-contain mix-blend-multiply" />
                </span>
              )}
              <span className={checked ? 'font-semibold' : ''}>{item.name}</span>
              {loadingFilterId === item.id && <LuLoader className="h-3.5 w-3.5 animate-spin text-ink-soft" />}
            </span>
          </Checkbox>
        );
      })}
    </div>
  );

  const tag = compact ? railTagClass : tagClass;

  return (
    <div className="font-libre text-ink">
      {categories.length > 0 && (
        <Section compact={compact} id="category" title="Category" open={openSections.has('category')} onToggle={() => toggleSection('category')}>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <Link
                key={c.href}
                href={c.href}
                onClick={() => {
                  c.onClick?.();
                  onNavigate?.();
                }}
                aria-current={c.active ? 'page' : undefined}
                className={tag(c.active)}
              >
                {c.name}
              </Link>
            ))}
          </div>
        </Section>
      )}

      {styles.length > 0 && (
        <Section
          compact={compact}
          id="style"
          title="Style"
          badge={countBadge(selected.subTypes.length)}
          open={openSections.has('style')}
          onToggle={() => toggleSection('style')}
        >
          <div className="flex flex-wrap gap-1.5">
            {styles.map((s) => {
              const active = selected.subTypes.includes(s.id);
              return (
                <button key={s.id} type="button" aria-pressed={active} onClick={() => onToggle('subTypes', s.id)} className={tag(active)}>
                  {s.name}
                </button>
              );
            })}
          </div>
        </Section>
      )}

      {metals.length > 0 && (
        <Section
          compact={compact}
          id="metal"
          title="Metal"
          badge={countBadge(selected.metal.length)}
          open={openSections.has('metal')}
          onToggle={() => toggleSection('metal')}
        >
          {optionList('metal', metals, true)}
        </Section>
      )}

      <Section
        compact={compact}
        id="price"
        title="Price"
        badge={priceActive ? 'Set' : undefined}
        open={openSections.has('price')}
        onToggle={() => toggleSection('price')}
      >
        {priceSlot}
      </Section>

      {shapes.length > 0 && (
        <Section
          compact={compact}
          id="shape"
          title="Shape"
          badge={countBadge(selected.shape.length)}
          open={openSections.has('shape')}
          onToggle={() => toggleSection('shape')}
        >
          {optionList('shape', shapes, true)}
        </Section>
      )}

      {diamondColors.length > 0 && (
        <Section
          compact={compact}
          id="diamond_color"
          title="Diamond color"
          badge={countBadge(selected.diamond_color.length)}
          open={openSections.has('diamond_color')}
          onToggle={() => toggleSection('diamond_color')}
        >
          {optionList('diamond_color', diamondColors)}
        </Section>
      )}

      {caratSlot && (
        <Section
          compact={compact}
          id="carat"
          title="Carat weight"
          badge={caratActive ? 'Set' : undefined}
          open={openSections.has('carat')}
          onToggle={() => toggleSection('carat')}
        >
          {caratSlot}
        </Section>
      )}

      {specialTitles.length > 0 && (
        <Section
          compact={compact}
          id="specialTitle"
          title="Featured"
          badge={countBadge(selected.specialTitle.length)}
          open={openSections.has('specialTitle')}
          onToggle={() => toggleSection('specialTitle')}
        >
          {optionList('specialTitle', specialTitles)}
        </Section>
      )}

      <Section
        compact={compact}
        id="gender"
        title="Wearer"
        badge={gender !== 1 ? (gender === 2 ? 'For him' : 'For her') : undefined}
        open={openSections.has('gender')}
        onToggle={() => toggleSection('gender')}
      >
        <div className="flex flex-wrap gap-1.5">
          {[
            { v: 1, label: 'Everyone' },
            { v: 3, label: 'For her' },
            { v: 2, label: 'For him' },
          ].map((g) => (
            <button key={g.v} type="button" aria-pressed={gender === g.v} onClick={() => onGender(g.v)} className={tag(gender === g.v)}>
              {g.label}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}

export default function FilterDrawer({ open, focusSection, onClose, resultCount, activeCount, onClearAll, ...panel }: FilterDrawerProps) {
  const lenis = useLenis();

  // Keep the page still while the drawer is open (Lenis drives page scrolling).
  useEffect(() => {
    if (open) {
      lenis?.stop();
    } else {
      lenis?.start();
    }
    return () => lenis?.start();
  }, [open, lenis]);

  // Scroll to the section that the filter bar button asked for.
  useEffect(() => {
    if (!open || !focusSection) {
      return;
    }
    const t = setTimeout(() => document.getElementById(`plp-filter-${focusSection}`)?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 320);
    return () => clearTimeout(t);
  }, [open, focusSection]);

  return (
    <ConfigProvider theme={plpTheme}>
      <Drawer
        open={open}
        onClose={onClose}
        placement="right"
        width="min(460px, 100vw)"
        closeIcon={null}
        title={
          <span className="text-[12px] font-medium uppercase tracking-[0.18em] text-ink">
            Refine {activeCount > 0 && <span className="font-normal text-ink-soft">· {activeCount} selected</span>}
          </span>
        }
        extra={
          <button type="button" onClick={onClose} className="bg-ink px-3.5 py-2 text-[10.5px] uppercase tracking-[0.18em] text-paper">
            Close
          </button>
        }
        footer={
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClearAll}
              className="text-[11px] uppercase tracking-[0.12em] text-ink-soft underline underline-offset-4 disabled:opacity-40"
              disabled={activeCount === 0}
            >
              Clear all
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-ink px-10 py-[15px] text-[11px] font-medium uppercase tracking-[0.2em] text-paper transition-colors hover:bg-ink-hover"
            >
              {resultCount > 0 ? `Show ${resultCount} piece${resultCount === 1 ? '' : 's'}` : 'No matches'}
            </button>
          </div>
        }
        classNames={{
          content: '!bg-paper',
          header: '!border-line !px-7 !py-[22px] sm:!px-[18px]',
          body: '!px-7 !py-0 sm:!px-[18px]',
          footer: '!border-line !px-7 !py-[18px] sm:!px-[18px]',
        }}
      >
        <div data-lenis-prevent>
          <FilterPanel {...panel} onNavigate={onClose} />
        </div>
      </Drawer>
    </ConfigProvider>
  );
}
