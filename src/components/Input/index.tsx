/* eslint-disable react/display-name */
'use client';
import React, { forwardRef } from 'react';

const shapes = {
  square: 'rounded-[0px]',
} as const;

const variants = {
  outline: {
    black_900_01: 'border-[#000000] border-[1.5px] border-solid',
    gray_400_01: 'border-[#c9c9c9] border-[1.5px] border-solid text-[#ababab]',
  },
} as const;

const sizes = {
  md: 'h-[48px] px-3',
  sm: 'h-[38px] px-3 text-[14px]',
  xs: 'h-[28px] px-2.5 text-[12px]',
} as const;

type InputProps = Omit<React.ComponentPropsWithoutRef<'input'>, 'prefix' | 'size'> &
  Partial<{
    label: string;
    prefix: React.ReactNode;
    suffix: React.ReactNode;
    shape: keyof typeof shapes;
    variant: keyof typeof variants | null;
    size: keyof typeof sizes;
    color: string;
  }>;

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = '',
      name = '',
      placeholder = '',
      type = 'text',
      label = '',
      prefix,
      suffix,
      onChange,
      shape,
      variant = 'outline',
      size = 'xs',
      color = 'gray_400_01',
      ...restProps
    },
    ref,
  ) => {
    return (
      <label
        className={`${className} flex items-center justify-center cursor-text border-[1.5px] border-solid  ${shape && shapes[shape]} ${
          variant && (variants[variant]?.[color as keyof (typeof variants)[typeof variant]] || variants[variant])
        } ${size && sizes[size]}`}
      >
        {!!label && label}
        {!!prefix && prefix}
        <input ref={ref} className="w-full" type={type} name={name} placeholder={placeholder} onChange={onChange} {...restProps} />
        {!!suffix && suffix}
      </label>
    );
  },
);

export { Input };
