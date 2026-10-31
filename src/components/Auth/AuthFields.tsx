'use client';

import React, { useState } from 'react';

import { Input } from 'antd';
import { LuEye, LuEyeOff } from 'react-icons/lu';

import type { InputProps } from 'antd';
import type { PasswordProps } from 'antd/es/input';

// Floating-label fields for the auth screens. Drop them straight into an antd <Form.Item>, which supplies
// id / value / onChange; the label sits inside the field and lifts once it is focused or filled.

const LABEL = 'pointer-events-none absolute left-4 z-[2] text-ink-soft transition-all duration-200 ease-luxe';
const LABEL_UP = 'top-[9px] text-[10px] uppercase tracking-[0.12em]';
// Browser autofill doesn't always fire onChange, so lift the label off the :autofill state too.
const LABEL_DOWN =
  'top-[18px] text-[13px] group-has-[input:-webkit-autofill]:top-[9px] group-has-[input:-webkit-autofill]:text-[10px] group-has-[input:-webkit-autofill]:uppercase group-has-[input:-webkit-autofill]:tracking-[0.12em]';
const FIELD = '!rounded-none !bg-transparent !px-4 !pb-0 !pt-[18px] !text-[14px]';

function useFloating(value: unknown, onFocus?: React.FocusEventHandler<HTMLInputElement>, onBlur?: React.FocusEventHandler<HTMLInputElement>) {
  const [focused, setFocused] = useState(false);
  const filled = value !== undefined && value !== null && String(value) !== '';
  return {
    up: focused || filled,
    handlers: {
      onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
        setFocused(true);
        onFocus?.(e);
      },
      onBlur: (e: React.FocusEvent<HTMLInputElement>) => {
        setFocused(false);
        onBlur?.(e);
      },
    },
  };
}

export function FloatInput({ label, value, onFocus, onBlur, className = '', ...rest }: InputProps & { label: string }) {
  const { up, handlers } = useFloating(value, onFocus, onBlur);
  return (
    <div className="group relative">
      <Input {...rest} value={value} {...handlers} className={`${FIELD} !h-14 ${className}`} />
      <label htmlFor={rest.id} className={`${LABEL} ${up ? LABEL_UP : LABEL_DOWN}`}>
        {label}
      </label>
    </div>
  );
}

export function FloatPassword({ label, value, onFocus, onBlur, className = '', ...rest }: PasswordProps & { label: string }) {
  const { up, handlers } = useFloating(value, onFocus, onBlur);
  return (
    <div className="group relative">
      <Input.Password
        {...rest}
        value={value}
        {...handlers}
        className={`${FIELD} !h-14 [&_.ant-input-suffix]:-mt-[18px] [&_.ant-input]:!bg-transparent ${className}`}
        iconRender={(visible) =>
          visible ? (
            <LuEyeOff aria-label="Hide password" className="!h-[18px] !w-[18px] cursor-pointer text-ink-soft hover:text-ink" />
          ) : (
            <LuEye aria-label="Show password" className="!h-[18px] !w-[18px] cursor-pointer text-ink-soft hover:text-ink" />
          )
        }
      />
      <label htmlFor={rest.id} className={`${LABEL} ${up ? LABEL_UP : LABEL_DOWN}`}>
        {label}
      </label>
    </div>
  );
}

export function FloatTextArea({
  label,
  value,
  onFocus,
  onBlur,
  className = '',
  ...rest
}: React.ComponentProps<typeof Input.TextArea> & { label: string }) {
  const [focused, setFocused] = useState(false);
  const up = focused || (value !== undefined && value !== null && String(value) !== '');
  return (
    <div className="group relative">
      <Input.TextArea
        {...rest}
        value={value}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        className={`!min-h-[130px] !rounded-none !bg-transparent !px-4 !pb-3 !pt-7 !text-[14px] ${className}`}
      />
      <label htmlFor={rest.id} className={`${LABEL} ${up ? LABEL_UP : 'top-[18px] text-[13px]'}`}>
        {label}
      </label>
    </div>
  );
}

const RULES = [
  { key: 'len', label: '8+ characters', test: (v: string) => v.length >= 8 },
  { key: 'case', label: 'Upper & lower case', test: (v: string) => /[a-z]/.test(v) && /[A-Z]/.test(v) },
  { key: 'num', label: 'A number', test: (v: string) => /\d/.test(v) },
];
const LEVELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const SEGMENT_FILL = ['', 'bg-danger', 'bg-gilt', 'bg-gilt', 'bg-ok'];

/** Strength meter + live rule checklist shown under a new-password field. Only 8+ characters is enforced. */
export function PasswordStrength({ value = '' }: { value?: string }) {
  const passed = RULES.map((r) => r.test(value));
  const score = value ? passed.filter(Boolean).length + (value.length >= 12 && /[^\w]/.test(value) ? 1 : 0) : 0;
  return (
    <div className="mb-6">
      <div className="grid grid-cols-4 gap-1" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <i key={n} className={`h-0.5 ${n <= score ? SEGMENT_FILL[score] : 'bg-line'}`} />
        ))}
      </div>
      <p className="m-0 mb-1 mt-1.5 min-h-4 text-right text-[11px] uppercase tracking-[0.12em] text-ink-soft" aria-live="polite">
        {LEVELS[score]}
      </p>
      <ul className="m-0 flex list-none flex-wrap gap-x-[18px] gap-y-1.5 p-0 text-[12px] text-ink-soft">
        {RULES.map((rule, i) => (
          <li key={rule.key} className={`flex items-center gap-1.5 ${passed[i] ? 'text-ink' : ''}`}>
            <span className={`h-1.5 w-1.5 rounded-full border ${passed[i] ? 'border-ok bg-ok' : 'border-line-strong'}`} />
            {rule.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
