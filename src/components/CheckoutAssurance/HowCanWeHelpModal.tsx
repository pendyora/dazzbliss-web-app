'use client';

import React, { useEffect, useState } from 'react';

import { ConfigProvider, Modal } from 'antd';
import Link from 'next/link';
import { LuCalendarDays, LuChevronRight, LuMail, LuPhone, LuX } from 'react-icons/lu';

import { checkoutTheme } from '@/app/checkout/checkoutTheme';

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
  'group flex w-full items-center gap-4 border border-line bg-paper px-5 py-4 text-left text-ink transition-colors hover:border-ink hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink sm:gap-3.5 sm:px-4 sm:py-3.5';

const ChannelBody = ({ Icon, title, detail }: { Icon: IconType; title: string; detail: string }) => (
  <>
    <span className="grid h-11 w-11 shrink-0 place-items-center bg-stone transition-colors group-hover:bg-ink sm:h-10 sm:w-10">
      <Icon
        className="h-[19px] w-[19px] text-gilt transition-colors group-hover:text-paper sm:h-[18px] sm:w-[18px]"
        strokeWidth={1.5}
        aria-hidden="true"
      />
    </span>
    <span className="flex min-w-0 flex-col gap-1.5">
      <span className="text-[10.5px] uppercase leading-none tracking-[0.16em] text-ink-soft">{title}</span>
      {/* The value itself, not a verb: the number is readable even to someone who never taps it. */}
      <span className="truncate text-[15px] leading-tight text-ink sm:text-[14px]">{detail}</span>
    </span>
    <LuChevronRight
      className="ml-auto h-[18px] w-[18px] shrink-0 text-ink-faint transition-all group-hover:translate-x-0.5 group-hover:text-ink"
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
    <ConfigProvider theme={checkoutTheme}>
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
        classNames={{ content: '!rounded-none !p-0' }}
      >
        {/* Tinted ground so the white rows read as objects on a surface rather than as outlines. */}
        <div className="relative bg-paper px-8 pb-8 pt-9 font-libre text-ink sm:px-5 sm:pb-6 sm:pt-7">
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3.5 top-3.5 grid h-9 w-9 place-items-center text-ink-soft transition-colors hover:bg-stone hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ink"
          >
            <LuX className="h-[18px] w-[18px]" strokeWidth={1.5} aria-hidden="true" />
          </button>

          <header className="mb-6 flex flex-col items-center gap-3 px-4 text-center sm:mb-5 sm:px-0">
            <span className="text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt">Client care</span>
            <h2 id="how-can-we-help-title" className="m-0 font-cormorant text-[clamp(30px,3.2vw,40px)] font-normal leading-none text-ink">
              How can we <em className="italic text-gilt">help?</em>
            </h2>
            <p className="m-0 max-w-[40ch] text-[13px] leading-[1.6] text-ink-soft">
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
    </ConfigProvider>
  );
};

export default HowCanWeHelpModal;
