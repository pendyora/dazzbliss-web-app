import React from 'react';

const sizes = {
  headingxs: 'text-[20px] font-semibold lg:text-[18px] md:text-[18px]',
  headings: 'text-[24px] font-semibold lg:text-[20px] md:text-[22px]',
};

export type HeadingProps = Partial<{
  className: string;
  as: any;
  size: keyof typeof sizes;
}> &
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;

const Heading: React.FC<React.PropsWithChildren<HeadingProps>> = ({ children, className = '', size = 'headingxs', as, ...restProps }) => {
  const Component = as || 'h6';

  return (
    <Component className={`font-['Noto_Sans'] ${className} ${sizes[size]}`} {...restProps}>
      {children}
    </Component>
  );
};

export { Heading };
