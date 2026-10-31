/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';
import React, { forwardRef, ReactElement, useEffect, useState } from 'react';

import Select, { Props } from 'react-select';

const shapes = {
  square: 'rounded-[0px]',
} as const;
const variants = {
  outline: {
    black_900: 'border-black-900 border border-solid',
  },
} as const;
const sizes = {
  xs: 'h-[64px] px-5',
} as const;

type selectOptionType = { value: string; label: string };
type SelectProps = Omit<Props, 'getOptionLabel'> &
  Partial<{
    className: string;
    options: selectOptionType[];
    isSearchable: boolean;
    isMulti: boolean;
    onChange: (option: any) => void;
    value: string;
    indicator: ReactElement;
    getOptionLabel: (e: any) => string;
    [x: string]: any;
    shape: keyof typeof shapes;
    variant: keyof typeof variants | null;
    size: keyof typeof sizes;
    color: keyof (typeof variants)[keyof typeof variants];
  }>;

const SelectBox = forwardRef<any, SelectProps>(
  (
    {
      children,
      className = '',
      options = [],
      isSearchable = false,
      isMulti = false,
      indicator,
      shape,
      variant = 'outline',
      size = 'xs',
      color = 'black_900',
      ...restProps
    },
    ref,
  ) => {
    const [menuPortalTarget, setMenuPortalTarget] = useState<HTMLElement | null>(null);

    useEffect(() => {
      setMenuPortalTarget(document.body);
    }, []);

    return (
      <>
        <Select
          ref={ref}
          options={options}
          className={`${className} flex `}
          isSearchable={isSearchable}
          isMulti={isMulti}
          components={{
            IndicatorSeparator: () => null,
            ...(indicator && { DropdownIndicator: () => indicator }),
          }}
          styles={{
            indicatorsContainer: (provided) => ({
              ...provided,
              padding: undefined,
              flexShrink: undefined,
              width: 'max-content',
              '& > div': { padding: 0 },
            }),
            container: (provided) => ({
              ...provided,
              zIndex: 0,
              alignItems: 'center',
            }),
            control: (provided) => ({
              ...provided,
              backgroundColor: 'transparent',
              border: '0 !important',
              boxShadow: 'none !important',
              minHeight: 'auto',
              width: '100%',
              flexWrap: undefined,
              '&:hover': {
                border: '0 !important',
              },
            }),
            input: (provided) => ({
              ...provided,
              color: 'inherit',
            }),
            option: (provided, state) => ({
              ...provided,
              display: 'flex',
              minWidth: 'max-content',
              width: '100%',
              backgroundColor: state.isSelected ? '#c5ccb4' : 'transparent',
              color: state.isSelected ? '#000000' : 'inherit',
              '&:hover': {
                backgroundColor: '#c5ccb4',
                color: '#000000',
              },
            }),
            singleValue: (provided) => ({
              ...provided,
              display: 'flex',
              marginLeft: undefined,
              marginRight: undefined,
            }),
            valueContainer: (provided) => ({
              ...provided,
              padding: 0,
              display: 'flex',
              flexWrap: undefined,
            }),
            placeholder: (provided) => ({
              ...provided,
              margin: 0,
            }),
            menuPortal: (base) => ({ ...base, zIndex: 999999 }),
            menu: (base) => ({ ...base, minWidth: 'max-content', width: 'max-content' }),
          }}
          menuPortalTarget={menuPortalTarget}
          closeMenuOnScroll={(event: any) => {
            return event.target.id === 'scrollContainer';
          }}
          {...restProps}
        />
        {children}
      </>
    );
  },
);

export { SelectBox };
