import React from 'react';

// Thin-stroke line icons for the header. They inherit color from `currentColor`.
const base = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.2, 'aria-hidden': true } as const;

export const SearchIcon = ({ className = 'h-[19px] w-[19px]' }: { className?: string }) => (
  <svg {...base} className={className}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m16 16 4.5 4.5" />
  </svg>
);

export const HeartIcon = ({ className = 'h-[19px] w-[19px]' }: { className?: string }) => (
  <svg {...base} className={className}>
    <path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10Z" />
  </svg>
);

export const BagIcon = ({ className = 'h-[19px] w-[19px]' }: { className?: string }) => (
  <svg {...base} className={className}>
    <path d="M5 8h14l-1 12H6L5 8Z" />
    <path d="M9 8V6.5a3 3 0 0 1 6 0V8" />
  </svg>
);

export const UserIcon = ({ className = 'h-[19px] w-[19px]' }: { className?: string }) => (
  <svg {...base} className={className}>
    <circle cx="12" cy="8.5" r="3.8" />
    <path d="M4.5 20c1.2-3.6 4.1-5.5 7.5-5.5s6.3 1.9 7.5 5.5" />
  </svg>
);
