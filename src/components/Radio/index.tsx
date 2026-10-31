/* eslint-disable react/display-name */
'use client';
import React, { forwardRef } from 'react';

const variants = {
  primary: '  ',
} as const;
const sizes = {
  xs: 'h-[22px] w-[22px]',
  sm: 'h-[28px] w-[28px]',
  md: 'h-[30px] w-[30px]',
} as const;

export type RadioProps = Omit<
  React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  'size' | 'prefix' | 'type' | 'onChange'
> &
  Partial<{
    className: string;
    name: string;
    label: string;
    id: string;
    variant: keyof typeof variants;
    size: keyof typeof sizes;
  }>;
const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className = '', name = '', label = '', id = 'radio_id', variant = 'primary', size = 'xs', ...restProps }, ref) => {
    return (
      <label className={className + ' flex items-center gap-[5px] cursor-pointer'}>
        <input
          className={` ${(size && sizes[size]) || ''} ${(variant && variants[variant]) || ''}`}
          ref={ref}
          type="radio"
          name={name}
          {...restProps}
          id={id}
        />
        <span>{label}</span>
      </label>
    );
  },
);

export { Radio };
