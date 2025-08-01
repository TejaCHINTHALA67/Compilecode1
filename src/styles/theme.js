import { DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6366F1', // Indigo
    primaryVariant: '#4F46E5',
    secondary: '#EC4899', // Pink
    secondaryVariant: '#DB2777',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    surfaceVariant: '#F1F5F9',
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    info: '#3B82F6',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#1E293B',
    onSurface: '#334155',
    onError: '#FFFFFF',
    accent: '#EC4899',
    disabled: '#CBD5E1',
    placeholder: '#94A3B8',
    backdrop: 'rgba(0, 0, 0, 0.5)',
    notification: '#EF4444',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    card: '#FFFFFF',
    gradient: {
      primary: ['#6366F1', '#8B5CF6'],
      secondary: ['#EC4899', '#F97316'],
      success: ['#10B981', '#34D399'],
      dark: ['#1E293B', '#334155'],
    },
  },
  fonts: {
    ...DefaultTheme.fonts,
    regular: {
      fontFamily: 'System',
      fontWeight: '400',
    },
    medium: {
      fontFamily: 'System',
      fontWeight: '500',
    },
    light: {
      fontFamily: 'System',
      fontWeight: '300',
    },
    thin: {
      fontFamily: 'System',
      fontWeight: '100',
    },
  },
  roundness: 12,
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  shadows: {
    small: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.05,
      shadowRadius: 2,
      elevation: 1,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 6,
    },
  },
  layout: {
    screen: {
      paddingHorizontal: 16,
      paddingVertical: 16,
    },
    container: {
      paddingHorizontal: 16,
    },
    card: {
      margin: 8,
      padding: 16,
      borderRadius: 12,
    },
  },
  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700',
      lineHeight: 40,
      color: '#1E293B',
    },
    h2: {
      fontSize: 28,
      fontWeight: '600',
      lineHeight: 36,
      color: '#1E293B',
    },
    h3: {
      fontSize: 24,
      fontWeight: '600',
      lineHeight: 32,
      color: '#1E293B',
    },
    h4: {
      fontSize: 20,
      fontWeight: '600',
      lineHeight: 28,
      color: '#1E293B',
    },
    h5: {
      fontSize: 18,
      fontWeight: '500',
      lineHeight: 24,
      color: '#1E293B',
    },
    h6: {
      fontSize: 16,
      fontWeight: '500',
      lineHeight: 22,
      color: '#1E293B',
    },
    subtitle1: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      color: '#475569',
    },
    subtitle2: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 20,
      color: '#475569',
    },
    body1: {
      fontSize: 16,
      fontWeight: '400',
      lineHeight: 24,
      color: '#334155',
    },
    body2: {
      fontSize: 14,
      fontWeight: '400',
      lineHeight: 20,
      color: '#334155',
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      lineHeight: 16,
      color: '#64748B',
    },
    overline: {
      fontSize: 10,
      fontWeight: '500',
      lineHeight: 14,
      color: '#64748B',
      textTransform: 'uppercase',
      letterSpacing: 1.5,
    },
    button: {
      fontSize: 14,
      fontWeight: '500',
      lineHeight: 16,
      textTransform: 'uppercase',
      letterSpacing: 1.25,
    },
  },
  animation: {
    scale: 1.02,
    duration: {
      short: 200,
      medium: 300,
      long: 500,
    },
    easing: {
      easeInOut: 'ease-in-out',
      easeOut: 'ease-out',
      easeIn: 'ease-in',
    },
  },
};

// Common style utilities
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spaceBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shadowCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.roundness,
    ...theme.shadows.medium,
  },
  gradientBackground: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
};