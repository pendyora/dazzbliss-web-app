'use client';

import React from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LuVideo } from 'react-icons/lu';

import { CARE_PAGES, SHELL } from './careInfo';

interface Props {
  title: React.ReactNode;
  crumb: string;
  intro?: string;
  updated?: string;
  /** Contact draws its own hero, so the grey title band is skipped. */
  ownHero?: boolean;
  children: React.ReactNode;
}

/** Shared frame for the client-care pages: title band, section tabs, page body and the "Still have a question?" band. */
export default function CareLayout({ title, crumb, intro, updated, ownHero, children }: Props) {
  const pathname = usePathname();

  return (
    <div className="bg-paper font-libre text-[14px] leading-[1.55] text-ink antialiased">
      {!ownHero && (
        <section className="border-b border-line bg-haze">
          <div
            className={`${SHELL} grid grid-cols-[minmax(0,1fr)_auto] items-end gap-6 pb-[clamp(28px,4vw,48px)] pt-[clamp(36px,5vw,64px)] md:grid-cols-1`}
          >
            <div>
              <Breadcrumb crumb={crumb} />
              <h1 className="m-0 font-cormorant text-[clamp(38px,4.4vw,58px)] font-medium leading-none tracking-[-0.01em]">{title}</h1>
              {intro && <p className="m-0 mt-3.5 max-w-[62ch] text-[15px] text-ink-soft">{intro}</p>}
            </div>
            {updated && <span className="whitespace-nowrap text-[12.5px] text-ink-faint">{updated}</span>}
          </div>
        </section>
      )}

      <nav aria-label="Client care" className="sticky top-[var(--header-height,108px)] z-20 border-b border-line bg-paper">
        <div className={`${SHELL} flex gap-7 overflow-x-auto [scrollbar-width:none]`}>
          {CARE_PAGES.map((p) => {
            const active = pathname === p.href;
            return (
              <Link
                key={p.href}
                href={p.href}
                aria-current={active ? 'page' : undefined}
                className={`flex-none border-b-[1.5px] pb-3.5 pt-4 text-[13px] ${
                  active ? 'border-ink font-semibold text-ink' : 'border-transparent text-ink-soft hover:text-ink'
                }`}
              >
                {p.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main>{children}</main>

      <section aria-label="Help" className="bg-navy text-noir-on">
        <div className={`${SHELL} flex flex-wrap items-center justify-between gap-6 py-9`}>
          <div>
            <b className="block font-cormorant text-[28px] font-medium text-paper">Still have a question?</b>
            <span className="text-noir-on/85">Talk to a jeweler. No pressure, no obligation.</span>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <Link
              href="/virtual-appointment"
              className="inline-flex h-[50px] items-center gap-2.5 border border-noir-on bg-noir-on px-6 text-[12px] font-semibold uppercase tracking-[0.14em] text-navy hover:text-navy"
            >
              <LuVideo className="h-4 w-4" strokeWidth={1.3} />
              Book a video call
            </Link>
            <Link
              href="/contactpage"
              className="inline-flex h-[50px] items-center border border-noir-on px-6 text-[12px] font-semibold uppercase tracking-[0.14em] text-noir-on hover:text-noir-on"
            >
              Contact us
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export function Breadcrumb({ crumb }: { crumb: string }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-3.5 flex flex-wrap gap-2 text-[12px] text-ink-soft">
      <Link href="/" className="text-ink-soft hover:text-ink">
        Home
      </Link>
      <span aria-hidden className="text-line-strong">
        /
      </span>
      <Link href="/contactpage" className="text-ink-soft hover:text-ink">
        Client care
      </Link>
      <span aria-hidden className="text-line-strong">
        /
      </span>
      <span aria-current="page">{crumb}</span>
    </nav>
  );
}
