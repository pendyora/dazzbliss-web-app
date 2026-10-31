'use client';
import React, { useCallback, useRef } from 'react';

export type UseHoneypotReturn = {
  HoneypotField: () => React.ReactElement;
  isHoneypotClean: () => boolean;
};

export const useHoneypot = (fieldName = 'website_confirm'): UseHoneypotReturn => {
  const ref = useRef<HTMLInputElement | null>(null);

  const isHoneypotClean = useCallback(() => {
    const value = ref.current?.value ?? '';
    return value.trim() === '';
  }, []);

  const HoneypotField = useCallback(
    () => (
      <input
        ref={(el) => {
          ref.current = el;
        }}
        type="text"
        name={fieldName}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{ display: 'none' }}
      />
    ),
    [fieldName],
  );

  return { HoneypotField, isHoneypotClean };
};
