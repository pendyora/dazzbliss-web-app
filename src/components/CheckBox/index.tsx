'use client';
import React, { forwardRef } from 'react';

const variants = {
  primary: ' checked:border-2  ',
} as const;
const sizes = {
  sm: 'h-[24px] w-[24px]',
  xs: 'h-[16px] w-[16px]',
} as const;

type CheckboxProps = Omit<
  React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
  'size' | 'prefix' | 'type' | 'onChange'
> &
  Partial<{
    className: string;
    name: string;
    label: string;
    id: string;
    onChange: any;
    variant: keyof typeof variants;
    size: keyof typeof sizes;
    onClick: () => void;
  }>;
const CheckBox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className = '', name = '', label = '', id = 'checkbox_id', onChange, variant = 'primary', size = 'xs', ...restProps }, ref) => {
    const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
      if (onChange) {
        onChange(e?.target?.checked);
      }
    };

    return (
      <>
        <div className={className + ' flex items-start gap-[5px] cursor-pointer'}>
          <input
            className={`!text-secondary ${(size && sizes[size]) || ''} ${(variant && variants[variant]) || ''}`}
            ref={ref}
            type="checkbox"
            name={name}
            onChange={handleChange}
            id={id}
            {...restProps}
          />
          {!!label && (
            <label htmlFor={id} className="pl-4">
              {label}
            </label>
          )}
        </div>
      </>
    );
  },
);

export { CheckBox };
