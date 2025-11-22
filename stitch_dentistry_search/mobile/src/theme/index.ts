import { createContext, ReactNode, useContext } from 'react';
import { ColorValue } from 'react-native';

export type AppTheme = {
  colors: {
    background: ColorValue;
    surface: ColorValue;
    primary: ColorValue;
    secondary: ColorValue;
    muted: ColorValue;
    border: ColorValue;
    text: ColorValue;
    success: ColorValue;
    warning: ColorValue;
    danger: ColorValue;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  radii: {
    sm: number;
    md: number;
    lg: number;
  };
  typography: {
    heading: number;
    subheading: number;
    body: number;
    caption: number;
  };
};

export const theme: AppTheme = {
  colors: {
    background: '#f6f7fb',
    surface: '#ffffff',
    primary: '#1d4ed8',
    secondary: '#0ea5e9',
    muted: '#64748b',
    border: '#e2e8f0',
    text: '#0f172a',
    success: '#16a34a',
    warning: '#d97706',
    danger: '#dc2626'
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24
  },
  radii: {
    sm: 6,
    md: 10,
    lg: 14
  },
  typography: {
    heading: 24,
    subheading: 18,
    body: 16,
    caption: 13
  }
};

const ThemeContext = createContext<AppTheme>(theme);

export const ThemeProvider = ({ children }: { children: ReactNode }) => (
  <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
);

export const useTheme = () => useContext(ThemeContext);
