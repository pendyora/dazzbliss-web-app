import themeColors from '@/styles/theme-colors';

// Shared antd theme for the bag and checkout (design reference: design-mockups/cart/index.html).
// Every colour comes from the Tailwind palette in src/styles/theme-colors.js.
export const checkoutTheme = {
  token: {
    colorPrimary: themeColors.ink.DEFAULT,
    colorText: themeColors.ink.DEFAULT,
    colorTextPlaceholder: themeColors.line.strong,
    colorBorder: themeColors.line.DEFAULT,
    colorError: themeColors.danger,
    colorBgContainer: themeColors.paper,
    colorBgContainerDisabled: themeColors.stone.DEFAULT,
    colorTextDisabled: themeColors.ink.soft,
    borderRadius: 0,
    borderRadiusSM: 0,
    borderRadiusLG: 0,
    controlHeight: 48,
    fontSize: 14,
    fontFamily: 'Libre Franklin, Helvetica Neue, Arial, sans-serif',
  },
  components: {
    Input: { activeBorderColor: themeColors.ink.DEFAULT, hoverBorderColor: themeColors.line.strong, activeShadow: 'none' },
    InputNumber: { activeBorderColor: themeColors.ink.DEFAULT, hoverBorderColor: themeColors.line.strong, activeShadow: 'none' },
    Select: {
      activeBorderColor: themeColors.ink.DEFAULT,
      hoverBorderColor: themeColors.line.strong,
      activeOutlineColor: 'transparent',
      optionSelectedBg: themeColors.stone.DEFAULT,
      optionActiveBg: themeColors.paper,
    },
    Form: { labelColor: themeColors.ink.soft, itemMarginBottom: 20, verticalLabelPadding: '0 0 6px' },
    Checkbox: { colorPrimary: themeColors.ink.DEFAULT, colorPrimaryHover: themeColors.ink.hover },
    Radio: { colorPrimary: themeColors.ink.DEFAULT, dotSize: 8, radioSize: 18 },
    Button: { defaultShadow: 'none', primaryShadow: 'none', defaultBorderColor: themeColors.ink.DEFAULT, defaultColor: themeColors.ink.DEFAULT },
    Drawer: { colorBgElevated: themeColors.paper },
    Modal: { contentBg: themeColors.paper, headerBg: themeColors.paper },
  },
};

// Tailwind class sets for antd <Button>s and form layout in the bag and checkout.
export const PRIMARY_BTN =
  '!h-12 !rounded-none !border-0 !bg-ink !px-8 !text-[11.5px] !font-medium uppercase !tracking-[0.2em] !text-paper hover:!bg-ink-hover disabled:!bg-ink/40 disabled:!text-paper';
export const SECONDARY_BTN =
  '!h-12 !rounded-none !border !border-ink !bg-transparent !px-8 !text-[11.5px] uppercase !tracking-[0.2em] !text-ink hover:!bg-ink hover:!text-paper';
export const FORM_LABELS =
  '[&_.ant-form-item-label>label]:!text-[10.5px] [&_.ant-form-item-label>label]:uppercase [&_.ant-form-item-label>label]:tracking-[0.16em] [&_.ant-form-item-label>label]:text-ink-soft';
export const GUTTER = 'px-[clamp(16px,3.2vw,56px)]';
