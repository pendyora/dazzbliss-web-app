/* eslint-disable react/display-name */
'use client';
import React, { forwardRef } from 'react';

const shapes = {
  square: 'rounded-[0px]',
} as const;
const variants = {
  tarOutlineBlack90001: '!border-[#000000] border-[1.5px] border-solid',
} as const;
const sizes = {
  xs: 'h-[160px] p-3',
} as const;

type TextAreaProps = Omit<
  React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>,
  'size' | 'prefix' | 'type' | 'onChange'
> &
  Partial<{
    className: string;
    name: string;
    placeholder: string;
    onChange: any;
    shape: keyof typeof shapes;
    variant: keyof typeof variants | null;
    size: keyof typeof sizes;
  }>;

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ className = '', name = '', placeholder = '', shape, size = 'xs', variant = 'tarOutlineBlack90001', onChange, ...restProps }, ref) => {
    const handleChange: React.ChangeEventHandler<HTMLTextAreaElement> = (e) => {
      if (onChange) {
        onChange(e?.target?.value);
      }
    };

    return (
      <textarea
        ref={ref}
        className={`${className} ${shape && shapes[shape]} ${size && sizes[size]} ${variant && variants[variant]}`}
        name={name}
        onChange={handleChange}
        placeholder={placeholder}
        {...restProps}
      />
    );
  },
);

export { TextArea };
