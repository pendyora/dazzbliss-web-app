import { checkoutTheme } from '@/app/checkout/checkoutTheme';
import themeColors from '@/styles/theme-colors';

// antd theme for the auth screens: the checkout theme with taller, darker-edged fields (design-mockups/auth).
export const authTheme = {
  token: { ...checkoutTheme.token, colorBorder: themeColors.line.strong, controlHeight: 56 },
  components: {
    ...checkoutTheme.components,
    Input: {
      activeBorderColor: themeColors.ink.DEFAULT,
      hoverBorderColor: themeColors.ink.soft,
      activeShadow: `inset 0 0 0 0.5px ${themeColors.ink.DEFAULT}`,
    },
    Form: { itemMarginBottom: 22 },
    Checkbox: { ...checkoutTheme.components.Checkbox, controlInteractiveSize: 18 },
  },
};

// Shared Tailwind class sets for the auth screens.
export const AUTH = {
  form: 'mx-auto w-full max-w-[440px]',
  kicker: 'm-0 mb-3 text-[10.5px] font-medium uppercase tracking-[0.22em] text-gilt',
  title: 'm-0 mb-3 font-cormorant text-[clamp(38px,3.6vw,52px)] font-normal leading-none tracking-[-0.01em] text-ink [&_em]:italic [&_em]:text-gilt',
  lede: 'm-0 mb-8 text-[14px] leading-[1.65] text-ink-soft [&_strong]:font-medium [&_strong]:text-ink',
  primaryBtn:
    '!h-14 !w-full !rounded-none !border-0 !bg-ink !text-[11.5px] !font-semibold uppercase !tracking-[0.22em] !text-paper hover:!bg-ink-hover disabled:!bg-ink/40 disabled:!text-paper',
  secondaryBtn:
    '!flex !h-14 !w-full items-center justify-center !rounded-none !border !border-ink !bg-transparent !text-[11.5px] !font-semibold uppercase !tracking-[0.22em] !text-ink hover:!bg-ink hover:!text-paper',
  link: 'text-ink underline underline-offset-[3px] hover:text-ink-hover',
  quietLink: 'text-[12.5px] text-ink-soft underline underline-offset-4 hover:text-ink',
  error: 'm-0 mb-5 border-l-2 border-danger bg-danger/5 px-4 py-3 text-[13px] text-danger',
  tips: 'mt-8 border-t border-line pt-[22px] text-[12.5px] text-ink-soft',
  tipsTitle: 'm-0 mb-2.5 text-[10.5px] font-semibold uppercase tracking-[0.2em] text-ink',
  // Removes antd's error-message indent and matches the mockup's small danger text.
  formFix: '[&_.ant-form-item-explain-error]:pt-1.5 [&_.ant-form-item-explain-error]:text-[12px]',
};

/** Masks the local part of an email for confirmation copy: shruti@gmail.com → s•••••@gmail.com */
export const maskEmail = (email: string) => {
  const [name, domain] = email.split('@');
  if (!domain) {
    return email;
  }
  return `${name.charAt(0)}${'•'.repeat(Math.max(name.length - 1, 3))}@${domain}`;
};
