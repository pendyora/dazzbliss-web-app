import themeColors from '@/styles/theme-colors';

import { plpTheme } from '../../FilterDrawer';

import type { ThemeConfig } from 'antd';

// antd tokens for the product detail page: square corners, ink accents, hairline borders.
export const pdpTheme: ThemeConfig = {
  ...plpTheme,
  token: {
    ...plpTheme.token,
    colorTextPlaceholder: themeColors.ink.soft,
    colorError: themeColors.danger,
    controlHeight: 46,
  },
  components: {
    ...plpTheme.components,
    Select: {
      ...plpTheme.components.Select,
      activeBorderColor: themeColors.ink.DEFAULT,
      hoverBorderColor: themeColors.ink.DEFAULT,
      optionPadding: '10px 14px',
    },
    Input: {
      activeBorderColor: themeColors.ink.DEFAULT,
      hoverBorderColor: themeColors.ink.DEFAULT,
      activeShadow: 'none',
    },
    Checkbox: {
      colorPrimary: themeColors.ink.DEFAULT,
      colorPrimaryHover: themeColors.ink.hover,
    },
    Radio: {
      colorPrimary: themeColors.ink.DEFAULT,
      buttonSolidCheckedBg: themeColors.ink.DEFAULT,
    },
    Tabs: {
      itemColor: themeColors.ink.soft,
      itemHoverColor: themeColors.ink.DEFAULT,
      itemSelectedColor: themeColors.ink.DEFAULT,
      itemActiveColor: themeColors.ink.DEFAULT,
      inkBarColor: themeColors.ink.DEFAULT,
      titleFontSize: 11,
      horizontalItemGutter: 32,
      horizontalItemPadding: '14px 0',
      horizontalMargin: '0 0 28px 0',
      cardBg: themeColors.paper,
    },
    Button: {
      defaultBorderColor: themeColors.ink.DEFAULT,
      defaultColor: themeColors.ink.DEFAULT,
      defaultHoverBorderColor: themeColors.ink.DEFAULT,
      defaultHoverColor: themeColors.paper,
      defaultHoverBg: themeColors.ink.DEFAULT,
      primaryShadow: 'none',
      defaultShadow: 'none',
      fontWeight: 500,
    },
    Tooltip: {
      colorBgSpotlight: themeColors.ink.DEFAULT,
    },
  },
};
