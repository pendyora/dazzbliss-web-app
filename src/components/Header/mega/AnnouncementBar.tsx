'use client';

import React, { useEffect, useMemo, useState } from 'react';

import Link from 'next/link';

import CurrencySelect from './CurrencySelect';
import { ANNOUNCEMENT_LINKS } from './headerContent';
import { ServiceIcon } from './MegaPanel';
import { toSitePath } from './menuModel';

const ROTATE_MS = 4500;

const pad = (n: number) => String(Math.max(0, Math.floor(n))).padStart(2, '0');

// Promo end dates are entered as Pacific wall-clock time, so the countdown measures against the current
// time in America/Los_Angeles (PST/PDT handled automatically) and is labelled "(PST)".
const pacificNow = (now: number) => new Date(new Date(now).toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })).getTime();

function countdown(endDate: string, now: number) {
  const diff = new Date(endDate).getTime() - pacificNow(now);
  if (!(diff > 0)) {
    return null;
  }
  return `${pad(diff / 86400000)}D ${pad((diff % 86400000) / 3600000)}H ${pad((diff % 3600000) / 60000)}M ${pad((diff % 60000) / 1000)}S`;
}

interface Props {
  promoStripData: any;
  currencyProps: React.ComponentProps<typeof CurrencySelect>;
}

/** Noir bar above the header: rotating messages from /promotional-strips, appointment links and currency. */
export default function AnnouncementBar({ promoStripData, currencyProps }: Props) {
  const [now, setNow] = useState(() => Date.now());
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const items: any[] = useMemo(() => (promoStripData?.is_active && Array.isArray(promoStripData?.data) ? promoStripData.data : []), [promoStripData]);
  // Timed messages disappear once their end date passes; a message without `enableEndDate` always shows
  // (with its countdown while it still has a live end date).
  const messages = items.filter((item) => item?.title && (!item?.enableEndDate || (item?.endDate && countdown(item.endDate, now))));
  const hasTimer = messages.some((m) => m?.endDate);

  useEffect(() => {
    if (!hasTimer) {
      return undefined;
    }
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [hasTimer]);

  useEffect(() => {
    if (messages.length < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return undefined;
    }
    const t = setInterval(() => setIndex((i) => i + 1), ROTATE_MS);
    return () => clearInterval(t);
  }, [messages.length, paused]);

  const active = messages.length ? index % messages.length : 0;

  return (
    <div
      role="region"
      aria-label="Announcements"
      className={`bg-noir text-[11px] uppercase tracking-[0.16em] text-noir-on ${messages.length === 0 ? 'lg:hidden' : ''}`}
    >
      <div className="mx-auto grid h-9 max-w-[1440px] grid-cols-[minmax(0,1fr)_minmax(0,560px)_minmax(max-content,1fr)] items-center gap-4 px-[clamp(16px,3.2vw,56px)] lg:grid-cols-1">
        <div
          className="relative col-start-2 h-[1.4em] min-w-0 overflow-hidden text-center lg:col-start-1"
          aria-live="polite"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {messages.map((item, i) => {
            const timer = item?.endDate ? countdown(item.endDate, now) : null;
            const state =
              i === active
                ? 'translate-y-0 opacity-100'
                : i === (active - 1 + messages.length) % messages.length
                  ? '-translate-y-full opacity-0'
                  : 'translate-y-full opacity-0';
            const href = toSitePath(item?.link);
            const className = `absolute inset-0 truncate whitespace-nowrap transition-[transform,opacity] duration-[600ms] ease-luxe ${state}`;
            const content = (
              <>
                {item?.prefixText && <span className="mr-2">{item.prefixText}</span>}
                {timer && <b className="mr-2 font-medium tabular-nums text-gilt-soft">{timer} (PST)</b>}
                {item.title}
              </>
            );
            // Messages without a link are plain text, not a link to the homepage.
            return href ? (
              <Link key={item.id ?? i} href={href} aria-hidden={i !== active} tabIndex={i === active ? 0 : -1} className={className}>
                {content}
              </Link>
            ) : (
              <span key={item.id ?? i} aria-hidden={i !== active} className={className}>
                {content}
              </span>
            );
          })}
        </div>
        <div className="col-start-3 flex items-center gap-[22px] justify-self-end lg:hidden">
          {ANNOUNCEMENT_LINKS.map(({ icon, label, href }) => (
            <Link key={href} href={href} className="inline-flex items-center gap-[7px] whitespace-nowrap text-noir-on/80 hover:text-noir-on">
              <ServiceIcon icon={icon} className="h-3.5 w-3.5" />
              {label}
            </Link>
          ))}
          <CurrencySelect {...currencyProps} />
        </div>
      </div>
    </div>
  );
}
