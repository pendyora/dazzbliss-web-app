'use client';

import React, { useEffect, useState } from 'react';

import { Modal } from 'antd';
import Link from 'next/link';
import { LuCalendarDays, LuChevronRight, LuMail, LuPhone, LuX } from 'react-icons/lu';

import type { IconType } from 'react-icons';

/**
 * "How can we help?" — the ways to reach a person, offered when a shopper stalls in checkout.
 *
 * Ordered by how fast they get an answer rather than by what is cheapest to staff: someone who has
 * stopped mid-checkout wants the quickest route, and burying the phone number under a form is how
 * that shopper leaves instead.
 *
 * ## Why it looks like this
 *
 * The first cut was three hairline boxes on a white ground — nothing separated a row from the
 * dialog behind it, so it read as empty space with text in it. Three things fix that:
 *
 * - the ground is tinted and the rows are white, so a row is an object sitting on a surface;
 * - the title is set in the brand serif at display size, which is what makes a small utility
 *   dialog feel like part of the shop rather than a system prompt;
 * - each row states what it *is* (the number, the address) rather than only what it does, so the
 *   dialog answers the question even for someone who never clicks.
 */

/** Taken from the footer, so a change there is not silently contradicted here. */
const PHONE_DISPLAY = '213-622-3264';
const PHONE_HREF = 'tel:2136223264';
const SUPPORT_EMAIL = 'service@ashclair.com';

type Channel = {
  Icon: IconType;
  title: string;
  detail: string;
  href: string;
  /** tel: / mailto: need a plain anchor; in-app routes go through next/link. */
  external?: boolean;
};

const CHANNELS: Channel[] = [
  { Icon: LuPhone, title: 'Call Us', detail: PHONE_DISPLAY, href: PHONE_HREF, external: true },
  { Icon: LuMail, title: 'Email Us', detail: SUPPORT_EMAIL, href: `mailto:${SUPPORT_EMAIL}`, external: true },
  { Icon: LuCalendarDays, title: 'Book an Appointment', detail: 'Virtual or in-person consultation', href: '/virtual-appointment' },
];

const ROW =
  'group flex w-full items-center gap-4 rounded-xl border border-transparent bg-white px-5 py-4 text-left shadow-[0_1px_2px_rgba(24,56,29,0.04)] transition-all hover:border-secondary hover:shadow-[0_4px_14px_-6px_rgba(24,56,29,0.25)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary sm:gap-3.5 sm:px-4 sm:py-3.5';

const ChannelBody = ({ Icon, title, detail }: { Icon: IconType; title: string; detail: string }) => (
  <>
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EEF0EC] transition-colors group-hover:bg-primary sm:h-11 sm:w-11">
      <Icon className="h-[21px] w-[21px] text-primary transition-colors group-hover:text-text_w sm:h-5 sm:w-5" strokeWidth={1.5} aria-hidden="true" />
    </span>
    <span className="flex min-w-0 flex-col gap-[3px]">
      <span className="font-notosans text-[11px] font-semibold uppercase leading-none tracking-[1.2px] text-secondary sm:text-[10px]">{title}</span>
      {/* The value itself, not a verb: the number is readable even to someone who never taps it. */}
      <span className="truncate font-notosans text-[16px] leading-tight text-black sm:text-[14px]">{detail}</span>
    </span>
    <LuChevronRight
      className="ml-auto h-5 w-5 shrink-0 text-gray-300 transition-all group-hover:translate-x-0.5 group-hover:text-secondary"
      strokeWidth={1.5}
      aria-hidden="true"
    />
  </>
);

const HowCanWeHelpModal = ({ open, onClose }: { open: boolean; onClose: () => void }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const checkViewport = () => setIsMobile(window.innerWidth < 640);
    checkViewport();
    window.addEventListener('resize', checkViewport);
    return () => window.removeEventListener('resize', checkViewport);
  }, []);

  return (
    <Modal
      centered={!isMobile}
      open={open}
      onCancel={onClose}
      footer={null}
      title={null}
      closeIcon={null}
      destroyOnClose
      maskClosable
      zIndex={10050}
      width={isMobile ? '100vw' : 528}
      rootClassName="how-can-we-help-modal"
      aria-labelledby="how-can-we-help-title"
    >
      {/* Tinted ground so the white rows read as objects on a surface rather than as outlines. */}
      <div className="relative rounded-lg bg-[#F7F8F5] px-7 pb-7 pt-8 sm:px-4 sm:pb-5 sm:pt-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-3.5 top-3.5 flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-black/5 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
        >
          <LuX className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
        </button>

        <header className="mb-6 flex flex-col items-center gap-2.5 px-4 text-center sm:mb-5 sm:px-0">
          <h2 id="how-can-we-help-title" className="font-castoro text-[27px] leading-tight text-primary sm:text-[22px]">
            How can we help?
          </h2>
          {/* The brand's diamond rule, the same mark the checkout panel uses. */}
          <span className="flex w-full max-w-[190px] items-center" aria-hidden="true">
            <span className="h-px flex-1 bg-secondary/25" />
            <span className="mx-2 h-[5px] w-[5px] rotate-45 bg-secondary/50" />
            <span className="h-px flex-1 bg-secondary/25" />
          </span>
          <p className="font-notosans text-[12.5px] leading-relaxed text-gray-600 sm:text-[11.5px]">
            Questions about sizing, stones or delivery? Our specialists are here to help.
          </p>
        </header>

        <div className="flex flex-col gap-2.5 sm:gap-2">
          {CHANNELS.map(({ Icon, title, detail, href, external }) =>
            external ? (
              <a key={title} href={href} className={ROW} onClick={onClose}>
                <ChannelBody Icon={Icon} title={title} detail={detail} />
              </a>
            ) : (
              <Link key={title} href={href} className={ROW} onClick={onClose}>
                <ChannelBody Icon={Icon} title={title} detail={detail} />
              </Link>
            ),
          )}
        </div>
      </div>
    </Modal>
  );
};

export default HowCanWeHelpModal;
