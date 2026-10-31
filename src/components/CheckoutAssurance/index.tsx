'use client';

import React, { useState } from 'react';

import dayjs, { Dayjs } from 'dayjs';
import Link from 'next/link';
import { LuCalendarCheck, LuChevronRight, LuHeadset, LuShieldCheck } from 'react-icons/lu';

import { Img } from '@/components';
import { whyAshclairBadges } from '@/components/WhyAllorya';

import HowCanWeHelpModal from './HowCanWeHelpModal';

import type { IconType } from 'react-icons';

/**
 * Reassurance panel for the cart / checkout order-summary column.
 *
 * ## Three cards
 *
 * What the shopper is owed on *this* order — when it lands, and the promises that come with it —
 * sits in the first card. The two below are standing offers that lead somewhere else, so they get
 * their own surfaces rather than being rows inside a shared frame: a card you can tap should look
 * like a thing, not like a line item.
 *
 * Separation comes from the gap between cards and the tint showing through it, not from borders
 * alone. The gutter matches the Order Summary and Products panels above (30px), so all three
 * blocks in the column start their content on the same line.
 */

/**
 * The delivery window, the same way the Thank You page builds its "Arrives" window.
 *
 * `estimation_date` is the window's first day, resolved by the query the PDP and order placement
 * already use, so nothing new is computed on the server. Both surfaces widen it by the two days
 * the PDP also adds — the PDP just happens to do that inside its own SQL.
 *
 * An order ships as one parcel, so the window opens on the slowest line; the earliest would
 * promise a date we could not keep.
 */
const cartDeliveryWindow = (cartProducts: any[]): string | null => {
  const dates = (cartProducts || [])
    .map((item: any) => item?.estimation_date)
    .filter(Boolean)
    .map((value: string) => dayjs(value))
    .filter((date: Dayjs) => date.isValid());

  if (dates.length === 0) {
    return null;
  }

  const start = dates.reduce((a: Dayjs, b: Dayjs) => (b.isAfter(a) ? b : a));
  // "September 15 - 17, 2026" — the PDP's spelling, month and year stated once.
  return `${start.format('MMMM DD')} - ${start.add(2, 'day').format('DD, YYYY')}`;
};

/** Every surface in the rail: square, hairline, no shadow — like the bag's summary panel. */
const CARD = 'border border-line bg-paper px-6 py-5 sm:px-5 sm:py-4';

/** The soft tile behind each icon. */
const BADGE_BG = 'bg-stone';

/**
 * One tappable card: badge, title, supporting line, chevron.
 *
 * `titleAccent` is the half of the heading that names the action — set in the brand green so the
 * row reads as an offer at a glance, without needing a button.
 */
const AssuranceRow = ({
  href,
  onSelect,
  Icon,
  title,
  titleAccent,
  body,
}: {
  href?: string;
  onSelect?: () => void;
  Icon: IconType;
  title: string;
  titleAccent?: string;
  body: string;
}) => {
  const shell = `${CARD} group flex w-full items-center gap-4 text-left font-libre transition-colors hover:border-ink sm:gap-3`;
  const inner = (
    <>
      <span className={`grid h-10 w-10 shrink-0 place-items-center sm:h-9 sm:w-9 ${BADGE_BG}`}>
        <Icon className="h-[18px] w-[18px] text-gilt" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <div className="flex min-w-0 flex-col gap-1">
        <span className="text-[11.5px] font-medium uppercase leading-tight tracking-[0.14em] text-ink">
          {title}
          {titleAccent ? <span className="text-gilt"> {titleAccent}</span> : null}
        </span>
        <span className="text-[12.5px] leading-[1.5] text-ink-soft">{body}</span>
      </div>
      <LuChevronRight
        className="ml-auto h-[18px] w-[18px] shrink-0 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-ink"
        strokeWidth={1.5}
        aria-hidden="true"
      />
    </>
  );

  return href ? (
    <Link href={href} className={shell}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onSelect} className={shell}>
      {inner}
    </button>
  );
};

type PanelProps = {
  cartProducts: any[];
  className?: string;
};

/**
 * The delivery block is dropped when no cart line yields a date — an empty promise is worse than
 * none — but the card still renders, because the five promises below it hold regardless.
 */
export const AssurancePanel = ({ cartProducts, className = '' }: PanelProps) => {
  const deliveryWindow = cartDeliveryWindow(cartProducts);
  const [helpOpen, setHelpOpen] = useState(false);

  return (
    <div className={`flex flex-col gap-3 font-libre text-ink ${className}`}>
      <div className="border border-line bg-paper">
        {deliveryWindow ? (
          <div className="flex items-center gap-4 px-6 py-5 sm:gap-3 sm:px-5 sm:py-4">
            <span className={`grid h-11 w-11 shrink-0 place-items-center sm:h-10 sm:w-10 ${BADGE_BG}`}>
              <LuCalendarCheck className="h-5 w-5 text-gilt sm:h-[18px] sm:w-[18px]" strokeWidth={1.5} aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-col gap-1.5">
              <span className="text-[10.5px] uppercase leading-none tracking-[0.16em] text-ink-soft">Estimated Delivery Date</span>
              {/* Kept on one line: the window is the answer, and breaking "September 2 - 4," from
                  its year turned the card's most-read line into two ragged ones. */}
              <span className="whitespace-nowrap font-cormorant text-[24px] font-medium leading-none text-ink sm:text-[21px]">{deliveryWindow}</span>
            </div>
          </div>
        ) : null}

        {/* The same five promises the PDP shows, under a rule that closes the delivery block —
            two unrelated things sharing a card need a line between them, not just space.

            No *vertical* rules between the badges though: five cells across this column leave each
            label barely a word wide, and the text collided with them. */}
        <div className={`bg-stone/45 px-5 py-5 sm:px-3 sm:py-4 ${deliveryWindow ? 'border-t border-line' : ''}`}>
          <p className="m-0 text-center text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">Why Ashclair?</p>
          <div className="mt-4 grid grid-cols-5 gap-x-2 sm:mt-3 sm:gap-x-1.5">
            {whyAshclairBadges.map((badge) => (
              <div key={badge.label} className="flex flex-col items-center gap-2 text-center sm:gap-1.5">
                {/* brightness-0 renders the remote SVGs in ink (the global `.why-ashclair-icon` filter tints them green). */}
                <Img src={badge.src} width={40} height={40} alt="" className="h-6 w-6 object-contain opacity-80 brightness-0 sm:h-5 sm:w-5" />
                <span className="text-[9.5px] uppercase leading-[1.35] tracking-[0.08em] text-ink-soft lg:text-[9px] sm:text-[8.5px]">
                  {badge.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Opens the contact dialog rather than navigating: a shopper this far into checkout
          should not have to leave the page to ask one question. */}
      <AssuranceRow
        onSelect={() => setHelpOpen(true)}
        Icon={LuHeadset}
        title="Still Deciding?"
        titleAccent="Let Us Help You"
        body="Talk it through with a jewelry specialist."
      />

      <HowCanWeHelpModal open={helpOpen} onClose={() => setHelpOpen(false)} />

      <AssuranceRow
        href="/returns-shipping"
        Icon={LuShieldCheck}
        title="30-Day Returns"
        body="Shop with confidence. Hassle-free returns, no questions asked."
      />
    </div>
  );
};
