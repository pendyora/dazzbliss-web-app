import React from 'react';

import SectionTitle from './SectionTitle';

interface Props {
  title?: string;
  className?: string;
  billingAddress?: React.ReactNode;
  userName?: React.ReactNode;
  userEmail?: React.ReactNode;
  userAddress?: React.ReactNode;
  userPhone?: React.ReactNode;
  editButton?: string;
  setIsEditOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onEditClick?: () => void;
}

/** Saved address shown once a checkout step is complete. */
export default function AddressDetalis({
  userName,
  userEmail,
  userAddress,
  userPhone,
  title = 'billing',
  setIsEditOpen,
  onEditClick,
  className = '',
}: Props) {
  const heading = `${title.charAt(0).toUpperCase()}${title.slice(1).toLowerCase()} address`;
  return (
    <div className={`${className} grid w-full gap-3.5`}>
      <SectionTitle
        done
        action={
          <button
            type="button"
            aria-label={`Edit ${title} address`}
            onClick={() => {
              onEditClick?.();
              setIsEditOpen(true);
            }}
            className="text-[11px] uppercase tracking-[0.12em] text-ink-soft underline underline-offset-4 hover:text-ink"
          >
            Edit
          </button>
        }
      >
        {heading}
      </SectionTitle>
      <div className="grid gap-1 border border-line px-[18px] py-4 text-[13px] leading-[1.55]">
        <span className="font-medium capitalize text-ink">{userName}</span>
        <span className="break-words capitalize text-ink-soft">{userAddress}</span>
        <span className="break-words text-ink-soft">{userEmail}</span>
        <span className="text-ink-soft tabular-nums">{userPhone}</span>
      </div>
    </div>
  );
}
