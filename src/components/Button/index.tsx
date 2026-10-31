import React from 'react';

const shapes = {
  round: 'rounded-[20px]',
  square: 'rounded-[0px]',
} as const;
const variants = {
  outline: {
    white_A700_01: 'border-[#ffffff] border-[1.5px] border-solid text-[#ffffff]',
    gray_800: 'border-[#3b3b3b] border-[1.5px] border-solid text-[#000000]',
    black_900_01: 'border-[#000000] border border-solid text-[#0b0b0b]',
  },
  fill: {
    gray_400: 'bg-[#c5ccb4] text-[#000000]',
  },
} as const;
const sizes = {
  xs: 'h-[30px] px-[28px] text-[20px] lg:text-[14px] 2xl:text-[16px] sm:text-[10px] sm:px-[20px]',
  sm: 'h-[40px] px-[34px] text-[20px] lg:text-[14px] 2xl:text-[16px] sm:text-[12px] ',
  md: 'h-[64px] px-[34px] text-[20px] lg:text-[14px] 2xl:text-[16px] sm:text-[12px] ',
} as const;

type ButtonProps = Omit<React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>, 'onClick'> &
  Partial<{
    className: string;
    leftIcon: React.ReactNode;
    rightIcon: React.ReactNode;
    onClick: () => void;
    shape: keyof typeof shapes;
    variant: keyof typeof variants | null;
    size: keyof typeof sizes;
    color: string;
  }>;
const Button: React.FC<React.PropsWithChildren<ButtonProps>> = ({
  children,
  className = '',
  leftIcon,
  rightIcon,
  shape,
  variant = 'outline',
  size = 'sm',
  color = 'black_900_01',
  ...restProps
}) => {
  return (
    <button
      className={`${className} flex flex-row items-center justify-center text-center cursor-pointer whitespace-nowrap ${shape && shapes[shape]} ${size && sizes[size]} ${variant && variants[variant]?.[color as keyof (typeof variants)[typeof variant]]}`}
      {...restProps}
    >
      {!!leftIcon && leftIcon}
      {children}
      {!!rightIcon && rightIcon}
    </button>
  );
};

export { Button };
