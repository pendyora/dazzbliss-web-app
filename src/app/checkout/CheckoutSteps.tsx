import React from 'react';

import Link from 'next/link';

type Step = 'bag' | 'delivery' | 'payment';

const STEPS: { key: Step; label: string; href?: string }[] = [
  { key: 'bag', label: 'Bag', href: '/cart' },
  { key: 'delivery', label: 'Delivery' },
  { key: 'payment', label: 'Payment' },
];

/** Bag → Delivery → Payment trail shared by the bag and checkout headers. */
export default function CheckoutSteps({ current }: { current: Step }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current);
  return (
    <ol
      aria-label="Checkout progress"
      className="m-0 mb-2 flex list-none items-center gap-[18px] p-0 text-[11px] uppercase tracking-[0.16em] text-ink-soft"
    >
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const isCurrent = i === currentIndex;
        const dot = (
          <i
            className={`grid h-[22px] w-[22px] place-items-center rounded-full border text-[10.5px] not-italic tracking-normal ${
              isCurrent ? 'border-ink bg-ink text-paper' : done ? 'border-gilt bg-gilt text-paper' : 'border-line-strong'
            }`}
          >
            {i + 1}
          </i>
        );
        const label = <span className="sm:hidden">{step.label}</span>;
        return (
          <React.Fragment key={step.key}>
            {i > 0 && <li aria-hidden className="h-px w-7 bg-line" />}
            <li aria-current={isCurrent ? 'step' : undefined} className={`flex items-center gap-2 ${isCurrent ? 'font-semibold text-ink' : ''}`}>
              {done && step.href ? (
                <Link href={step.href} className="flex items-center gap-2 text-ink-soft hover:text-ink">
                  {dot}
                  {label}
                </Link>
              ) : (
                <>
                  {dot}
                  {label}
                </>
              )}
            </li>
          </React.Fragment>
        );
      })}
    </ol>
  );
}
