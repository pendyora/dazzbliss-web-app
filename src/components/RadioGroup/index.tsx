/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable react/display-name */
'use client';
import React, { ChangeEvent, Children, cloneElement, forwardRef, HTMLAttributes, useEffect, useState } from 'react';

import { Radio } from '../Radio';

type RadioGroupProps = Omit<React.DetailedHTMLProps<HTMLAttributes<HTMLInputElement>, HTMLInputElement>, 'onChange'> &
  Partial<{
    selectedValue: string;
    orientation: string;
    name: string;
    disabled: boolean;
    onChange: any;
  }>;

const RadioGroup = forwardRef<HTMLInputElement, RadioGroupProps>(
  ({ selectedValue, orientation = 'horizontal', className, name, children, onChange, disabled }, ref) => {
    const [value, setValue] = useState(selectedValue);

    useEffect(() => {
      setValue(selectedValue);
    }, [selectedValue]);

    const handleChange = (event: ChangeEvent<HTMLInputElement>, val: string, isDisabled: boolean) => {
      if (isDisabled) {
        return;
      }
      setValue(val);
      onChange && onChange(val, event);
    };

    const compChildren = Children.map(children, (child: any) => {
      if (child?.type === Radio) {
        return cloneElement(child, {
          value: child.props.value,
          name,
          checked: child.props.value === value,
          onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleChange(e, child.props.value, child.props.disabled),
          orientation,
          disabled: child.props.disabled,
        });
      }
      return child;
    });

    return (
      <>
        <div className={className}>{compChildren}</div>
      </>
    );
  },
);

export { RadioGroup };
