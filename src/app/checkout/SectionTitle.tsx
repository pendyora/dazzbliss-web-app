import React from 'react';

import { LuCheck } from 'react-icons/lu';

interface Props {
  children: React.ReactNode;
  /** Step not reached yet. */
  muted?: boolean;
  /** Step completed. */
  done?: boolean;
  action?: React.ReactNode;
}

/** Serif section heading used by each checkout step (Contact, Billing address, …). */
export default function SectionTitle({ children, muted, done, action }: Props) {
  return (
    <div className="flex w-full flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
      <h2 className={`m-0 flex items-center gap-2.5 font-cormorant text-[28px] font-medium leading-none text-ink ${muted ? 'opacity-40' : ''}`}>
        {children}
        {done && (
          <span aria-label="Completed" className="inline-grid h-5 w-5 place-items-center rounded-full bg-gilt text-paper">
            <LuCheck className="h-3 w-3" strokeWidth={3} />
          </span>
        )}
      </h2>
      {action}
    </div>
  );
}
