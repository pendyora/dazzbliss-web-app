import React from 'react';

const shapes = {
  round: 'rounded-none',
  square: 'rounded-[0px]',
} as const;
const variants = {
  outline: {
    white_A700_01: 'border border-solid border-paper text-paper transition-colors hover:bg-paper hover:text-ink',
    gray_800: 'border border-solid border-ink text-ink transition-colors hover:bg-ink hover:text-paper',
    black_900_01: 'border border-solid border-ink text-ink transition-colors hover:bg-ink hover:text-paper',
  },
  fill: {
    gray_400: 'bg-ink text-paper transition-colors hover:bg-ink-hover',
  },
} as const;
const sizes = {
  xs: 'h-[36px] px-6 text-[10.5px] font-medium uppercase tracking-[0.18em] sm:px-4',
  sm: 'h-12 px-8 text-[11.5px] font-medium uppercase tracking-[0.2em] sm:px-5',
  md: 'h-14 px-8 text-[11.5px] font-medium uppercase tracking-[0.22em] sm:px-5',
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
