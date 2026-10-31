import React from 'react';

const sizes = {
  textxs: 'text-[10px] font-normal ',
  texts: 'text-[12px] font-normal  lg:text-[10px]',
  textmd: 'text-[14px] font-normal  lg:text-[12px]',
  textlg: 'text-[16px] font-normal  lg:text-[13px]',
  textxl: 'text-[18px] font-normal  lg:text-[15px]',
  text2xl: 'text-[20px] font-normal  lg:text-[17px]',
  text3xl: 'text-[22px] font-normal lg:text-[18px]',
  text4xl: 'text-[24px] font-normal  lg:text-[20px] md:text-[22px]',
  text5xl: 'text-[26px] font-normal  lg:text-[22px] md:text-[24px] sm:text-[22px]',
  text6xl: 'text-[30px] font-normal  lg:text-[25px] md:text-[26px] sm:text-[26px]',
  text7xl: 'text-[32px] font-normal  lg:text-[27px] md:text-[30px] sm:text-[28px]',
  text8xl: 'text-[34px] font-normal  lg:text-[28px] md:text-[32px] sm:text-[30px]',
  text9xl: 'text-[40px] font-normal  lg:text-[34px] md:text-[38px] sm:text-[36px]',
  text10xl: 'text-[44px] font-normal  lg:text-[37px] md:text-[40px] sm:text-[34px]',
  text11xl: 'text-[50px] font-normal  lg:text-[42px] md:text-[46px] sm:text-[40px]',
};

export type TextProps = Partial<{
  className: string;
  as: any;
  size: keyof typeof sizes;
}> &
  React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;

const Text: React.FC<React.PropsWithChildren<TextProps>> = ({ children, className = '', as, size = 'text3xl', ...restProps }) => {
  const Component = as || 'p';

  return (
    <Component className={`text-[#000000] ${className} ${sizes[size]}`} {...restProps}>
      {children}
    </Component>
  );
};

export { Text };
