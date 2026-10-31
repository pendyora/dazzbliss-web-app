'use client';

import { Fragment } from 'react';

import { Image } from 'antd';
import Link from 'next/link';
import { LuArrowRight, LuCheck, LuGift, LuLock } from 'react-icons/lu';

import { useAppSelector } from '@/store';
import { formatCurrency } from '@/utils/common';

interface Props {
  className?: string;
}

/**
 * Free Gift Above X Amount — the unlock strip.
 *
 * Shows just the two rungs that matter: the highest gift the cart has already unlocked (✓) and
 * the next one still locked (🔒), with a progress bar to it. A shopper who has passed a lower
 * tier no longer needs to see it, and only the immediate next tier is a useful "spend a little
 * more" nudge — so at the top tier only the earned gift shows, never the whole ladder.
 *
 * The tiers come from the server (`evaluate`), the same computation that decides what actually
 * gets granted, so the strip can never disagree with the gift.
 */
export default function FreeGiftProgress({ className = '' }: Props) {
  const { evaluated, remaining, subtotal, activeOffer, nextOffer, gift, milestones, declined } = useAppSelector((state: any) => state.freeGift);

  const tiers: any[] = Array.isArray(milestones) ? milestones : [];

  // Nothing to say until the first evaluation lands, or when no offers are configured.
  if (!evaluated || (!activeOffer && !nextOffer && !tiers.length)) {
    return null;
  }

  const shortfall = formatCurrency(Math.ceil(Number(remaining) || 0));

  // Only two rungs matter: the highest gift already unlocked, and the next one still locked.
  // `is_current` is the single winning tier the server actually grants; fall back to the highest
  // unlocked milestone if an older server omits it.
  const unlockedTiers = tiers.filter((tier) => tier.unlocked);
  const currentTier = tiers.find((tier) => tier.is_current) ?? unlockedTiers[unlockedTiers.length - 1] ?? null;
  const nextLockedTier = tiers.find((tier) => !tier.unlocked) ?? null;
  const displayTiers = [currentTier, nextLockedTier].filter(Boolean);
  // A phone has room for one node beside the copy, so it shows the goal — the next locked
  // tier — falling back to the earned one when everything is unlocked.
  const mobileTier = nextLockedTier ?? currentTier;

  const anyUnlocked = Boolean(currentTier);
  const allUnlocked = tiers.length > 0 && !nextLockedTier;

  const currentGiftName = gift?.title ?? activeOffer?.gift_title ?? currentTier?.gift_title;
  const nextGiftName = nextOffer?.gift_title ?? nextOffer?.name ?? nextLockedTier?.gift_title;

  // Progress runs toward the next locked tier; once everything is unlocked the bar is full.
  const targetAmount = Number(nextOffer?.minimum_order_amount ?? activeOffer?.minimum_order_amount ?? 0);
  const fillPct = allUnlocked ? 100 : targetAmount > 0 ? Math.min(100, Math.round((Number(subtotal) / targetAmount) * 100)) : 0;

  // Two separate statements when a gift is already earned: what they have, then what is
  // still ahead. Compressing both into one sentence buried the reward they just won.
  const shortfallAmount = Math.max(0, Math.ceil(Number(remaining) || 0));
  // Any single product at or above the shortfall closes the gap, so only the lower bound is
  // meaningful; the PLP clamps this sentinel to the catalogue's real maximum.
  // Floor only. The cart knows what a product must cost to close the gap, not what the
  // catalogue tops out at, so it sends no maximum — the PLP substitutes the real one. This
  // keeps the URL clean and stable: an earlier sentinel max showed up in the address bar and
  // had to be rewritten seconds after load.
  const shopHref = `/all?min_price=${shortfallAmount}`;

  const em = 'font-medium text-ink';

  const headline = allUnlocked ? (
    <>
      <span aria-hidden="true">🎉 </span>
      <span className={em}>Congratulations!</span> Your <span className={em}>FREE {currentGiftName}</span>{' '}
      {/* Never claim a refused gift is on the order — the strip would be contradicting the
          card right below it, which is offering to add the same gift back. */}
      {declined ? 'is waiting in your cart.' : 'is included.'}
    </>
  ) : anyUnlocked ? (
    <>
      <span aria-hidden="true">🎉 </span>
      <span className={em}>Congratulations!</span> You&apos;ve unlocked your <span className={em}>FREE {currentGiftName}</span>.
    </>
  ) : (
    <>
      Add <span className={`${em} tabular-nums`}>{shortfall}</span> more to unlock your <span className={em}>FREE {nextGiftName}</span>.
    </>
  );

  // Only shown once something is unlocked — otherwise the headline already says it.
  const subline =
    anyUnlocked && !allUnlocked ? (
      <>
        Add <span className={`${em} tabular-nums`}>{shortfall}</span> more to unlock your <span className={em}>next gift</span>.
      </>
    ) : null;

  return (
    <div className={`bg-mist px-6 py-5 font-libre text-ink md:px-4 md:py-4 sm:px-3.5 sm:py-3.5 ${className}`} role="status" aria-live="polite">
      <div className="flex items-center gap-6 lg:gap-4 sm:gap-3">
        {/* Icon + copy + progress bar */}
        <div className="flex min-w-0 flex-1 items-center gap-4 sm:order-1 sm:items-start sm:gap-2.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center border border-line bg-paper text-gilt sm:h-8 sm:w-8">
            {allUnlocked ? (
              <LuCheck className="h-[18px] w-[18px] sm:h-4 sm:w-4" strokeWidth={2} />
            ) : (
              <LuGift className="h-[18px] w-[18px] sm:h-4 sm:w-4" strokeWidth={1.6} />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <span className="mb-1 block text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt sm:text-[10px]">Free gift</span>
            <p
              className={`m-0 text-pretty text-[13.5px] leading-[1.5] text-ink-soft sm:text-[12.5px] sm:leading-[1.4] ${subline ? 'sm:hidden' : ''}`}
            >
              {headline}
            </p>
            {subline && (
              <p className="m-0 mt-0.5 text-pretty text-[13.5px] leading-[1.5] text-ink-soft sm:mt-0 sm:text-[12.5px] sm:leading-[1.4]">{subline}</p>
            )}

            {!allUnlocked && shortfallAmount > 0 && (
              <Link
                href={shopHref}
                className="mt-3 inline-flex h-9 w-fit items-center gap-2 border border-ink bg-paper px-4 text-[10.5px] font-medium uppercase tracking-[0.16em] text-ink transition-colors hover:bg-ink hover:text-paper sm:w-full sm:justify-center"
              >
                Add {shortfall} more
                <LuArrowRight className="h-3.5 w-3.5 shrink-0" strokeWidth={1.8} />
              </Link>
            )}

            {/* Solid fill for what is earned, a tick where it stops, then a dashed run to the
                amount still to go. The shortfall is what the shopper can act on, so it gets the
                figure — a raw "spent / target" ratio made them do the subtraction themselves. */}
            <div className="mt-3.5 flex items-center gap-3 sm:mt-2.5 sm:gap-2">
              <span className="relative h-[3px] min-w-0 flex-1 overflow-hidden bg-line-strong/60">
                <span className="absolute inset-y-0 left-0 bg-ink transition-[width] duration-500 ease-out" style={{ width: `${fillPct}%` }} />
              </span>

              {/* Only once a tier is actually earned — a tick on an empty cart would claim
                  progress the shopper has not made. */}
              {anyUnlocked && (
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink text-paper sm:h-[17px] sm:w-[17px]" aria-hidden="true">
                  <LuCheck className="h-3 w-3 sm:h-[10px] sm:w-[10px]" strokeWidth={3} />
                </span>
              )}

              {!allUnlocked && shortfallAmount > 0 && (
                <>
                  {/* Dropped on a phone: the copy column is ~200px and the dash is the one
                      part that carries no information. */}
                  <span className="h-px w-5 shrink-0 border-t border-dashed border-line-strong sm:hidden" aria-hidden="true" />
                  <span className="shrink-0 text-right leading-none">
                    <span className="block whitespace-nowrap font-cormorant text-[20px] font-medium tabular-nums text-ink sm:text-[17px]">
                      {shortfall}
                    </span>
                    <span className="mt-0.5 block text-[9.5px] uppercase tracking-[0.16em] text-ink-soft sm:text-[8.5px]">To go</span>
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <span className="w-px self-stretch bg-line-strong/70 sm:order-2" aria-hidden="true" />

        {/* The highest unlocked gift (✓) and the next locked one (🔒) — never the full ladder. */}
        <div className="flex shrink-0 items-start justify-center sm:order-3">
          {displayTiers.map((tier, index) => (
            <Fragment key={tier.id}>
              {index > 0 && <span className="mt-[44px] h-px w-4 shrink-0 border-t border-dashed border-line-strong sm:hidden" aria-hidden="true" />}
              <div className={`flex w-[116px] flex-col items-center text-center sm:w-[92px] ${tier.id === mobileTier?.id ? '' : 'sm:hidden'}`}>
                <span className="relative">
                  <span
                    className={`flex h-[88px] w-[88px] items-center justify-center overflow-hidden border bg-paper md:h-[76px] md:w-[76px] sm:h-[72px] sm:w-[72px] [&_.ant-image]:h-full [&_.ant-image]:w-full ${tier.unlocked ? 'border-ink/40' : 'border-line'} ${tier.available === false ? 'opacity-40 grayscale' : ''}`}
                  >
                    {tier.image ? (
                      /* Clickable: an 88px tile is too small to judge a ring by, and the locked
                         tier is the one the shopper is deciding whether to spend more for. The
                         lightbox shows the full asset — the dimming and greyscale that mark the
                         locked/unavailable states live on the wrapper, so the preview is never
                         faded. `mask: false` keeps the default hover overlay off the thumbnail;
                         the cursor is the affordance instead. */
                      <Image
                        src={tier.image}
                        alt={tier.gift_title}
                        preview={{
                          mask: false,
                          maskClassName: '!bg-transparent',
                          // The gift assets carry a lot of white padding of their own, so at phone
                          // widths antd's fit-to-viewport sizing turned the preview into a near
                          // full-bleed white slab with a small product in the middle. Capping the
                          // width pulls that white block in around the product.
                          rootClassName: 'md:[&_.ant-image-preview-img]:!max-w-[72vw] sm:[&_.ant-image-preview-img]:!max-w-[80vw]',
                        }}
                        title={`Free ${tier.gift_title}`}
                        className={`h-full w-full cursor-zoom-in object-contain ${tier.unlocked ? '' : 'opacity-70'}`}
                        fallback="/images/no_images.svg"
                      />
                    ) : (
                      <LuGift className="h-7 w-7 text-ink-faint sm:h-6 sm:w-6" strokeWidth={1.4} />
                    )}
                  </span>

                  {/* Earned tier gets a filled tick, the locked one a lock — distinguishable by
                    shape as well as colour. Parked on the tile's top corner. */}
                  {tier.unlocked ? (
                    <span
                      className="absolute -left-[7px] -top-[7px] grid h-[22px] w-[22px] place-items-center rounded-full bg-ink text-paper ring-2 ring-mist sm:h-5 sm:w-5"
                      aria-hidden="true"
                    >
                      <LuCheck className="h-3 w-3" strokeWidth={3} />
                    </span>
                  ) : (
                    <span
                      className="absolute -right-[7px] -top-[7px] grid h-[22px] w-[22px] place-items-center rounded-full border border-line-strong bg-paper text-ink-soft ring-2 ring-mist sm:h-5 sm:w-5"
                      aria-hidden="true"
                    >
                      <LuLock className="h-[11px] w-[11px]" strokeWidth={2} />
                    </span>
                  )}
                </span>

                {/* Fixed at two lines' height whether the name needs one or two, so the badges
                  below always sit on the same baseline across tiers. Anything longer is clamped
                  with an ellipsis; `title` reveals the full name on hover. */}
                <span
                  title={`Free ${tier.gift_title}`}
                  className={`mt-2.5 line-clamp-2 h-[25px] text-[10px] uppercase leading-tight tracking-[0.12em] sm:mt-2 sm:h-[23px] sm:text-[9px] sm:tracking-[0.06em] ${
                    tier.unlocked ? 'text-ink' : 'text-ink-soft'
                  }`}
                >
                  Free {tier.gift_title}
                </span>

                {/* Spells out what the tick and padlock mean, so the state does not rely on
                  reading a small glyph. */}
                <span
                  className={`mt-1.5 whitespace-nowrap px-2 py-[4px] text-[9px] font-medium uppercase leading-none tracking-[0.16em] sm:mt-1 sm:px-1.5 sm:text-[8px] sm:tracking-[0.1em] ${
                    tier.unlocked ? 'bg-ink text-paper' : 'border border-line-strong bg-paper text-ink-soft'
                  }`}
                >
                  {tier.unlocked ? 'Unlocked' : 'Next gift'}
                </span>
              </div>
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}
