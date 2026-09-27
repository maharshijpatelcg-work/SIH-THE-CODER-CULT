// Design System: YATRA — Premium Luxury Heritage Editorial
// Luxury = restraint. Gold is an accent, never a fill-everywhere decoration.

import { Platform } from 'react-native';
import Constants from 'expo-constants';

export interface AppThemeColors {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceElevated: string;
  surfaceHighlight: string;
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  secondaryLight: string;
  accent: string;
  accentLight: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  border: string;
  borderLight: string;
  divider: string;
  goldSoft: string;
  goldHairline: string;
  card: string;
  badge: string;
  isDark: boolean;
  primaryContainer: string;
  secondaryContainer: string;
  secondaryFixed: string;
  surfaceContainerLow: string;
  surfaceContainerHighest: string;
  errorContainer: string;
  onErrorContainer: string;
}

export const DarkThemeColors: AppThemeColors = {
  background: '#0F0F0F',
  backgroundAlt: '#141414',
  surface: '#171717',
  surfaceElevated: '#1D1D1D',
  surfaceHighlight: '#242424',
  primary: '#D4AF7C',
  primaryDark: '#A8864F',
  primaryLight: '#E5C9A4',
  secondary: '#C17F59',
  secondaryLight: '#D4976F',
  accent: '#5B8FB9',
  accentLight: '#7BADD4',
  success: '#7FB685',
  warning: '#D9A45B',
  error: '#D97B77',
  info: '#7BAFD4',
  text: '#F5F1E8',
  textSecondary: '#A7A7A7',
  textMuted: '#777777',
  textInverse: '#0F0F0F',
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.12)',
  divider: 'rgba(255, 255, 255, 0.07)',
  goldSoft: 'rgba(212, 175, 124, 0.14)',
  goldHairline: 'rgba(212, 175, 124, 0.22)',
  card: '#1D1D1D',
  badge: 'rgba(212, 175, 124, 0.14)',
  isDark: true,
  primaryContainer: '#D4AF7C',
  secondaryContainer: '#2A2218',
  secondaryFixed: '#3E301F',
  surfaceContainerLow: '#171717',
  surfaceContainerHighest: '#242424',
  errorContainer: 'rgba(217, 123, 119, 0.2)',
  onErrorContainer: '#FFDAD6',
};

export const LightThemeColors: AppThemeColors = {
  background: '#FBF9F6',
  backgroundAlt: '#F5F3F0',
  surface: '#FBF9F6',
  surfaceElevated: '#FFFFFF',
  surfaceHighlight: '#EFEEEB',
  primary: '#9A442D',       // Terracotta warm primary from Stitch
  primaryDark: '#7C2E19',
  primaryLight: '#E07A5F',
  secondary: '#7A5814',     // Warm antique bronze from Stitch
  secondaryLight: '#EDBF71',
  accent: '#5B8FB9',
  accentLight: '#7BADD4',
  success: '#2E7D32',
  warning: '#D9A45B',
  error: '#BA1A1A',
  info: '#5B8FB9',
  text: '#1B1C1A',          // On-surface obsidian slate from Stitch
  textSecondary: '#55423E',  // On-surface variant
  textMuted: '#88726D',      // Muted outline
  textInverse: '#FFFFFF',
  border: '#E4E2DF',
  borderLight: '#EAE8E5',
  divider: '#E4E2DF',
  goldSoft: 'rgba(122, 88, 20, 0.10)',
  goldHairline: 'rgba(122, 88, 20, 0.22)',
  card: '#FFFFFF',
  badge: '#F5F3F0',
  isDark: false,
  primaryContainer: '#E07A5F',
  secondaryContainer: '#FFD081',
  secondaryFixed: '#FFDEAA',
  surfaceContainerLow: '#F5F3F0',
  surfaceContainerHighest: '#E4E2DF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#93000A',
};

export function getAppTheme(mode: 'light' | 'dark' = 'light'): AppThemeColors {
  return mode === 'dark' ? DarkThemeColors : LightThemeColors;
}

export const Colors = {
  // Core luxury palette
  background: '#0F0F0F',
  backgroundAlt: '#141414',
  surface: '#171717',
  surfaceElevated: '#1D1D1D',
  surfaceHighlight: '#242424',

  // Heritage accents (restrained gold — use sparingly)
  primary: '#D4AF7C',       // Heritage accent gold
  primaryDark: '#A8864F',   // Dark gold
  primaryLight: '#E5C9A4',  // Light gold
  secondary: '#C17F59',     // Terracotta
  secondaryLight: '#D4976F',
  accent: '#5B8FB9',        // Sky blue (maps)
  accentLight: '#7BADD4',

  // Status colors (muted, non-neon)
  success: '#7FB685',
  warning: '#D9A45B',
  error: '#D97B77',
  info: '#7BAFD4',

  // Text
  text: '#F5F1E8',           // Warm ivory
  textSecondary: '#A7A7A7',  // Muted sandstone
  textMuted: '#777777',      // Subtle muted
  textInverse: '#0F0F0F',    // Deep charcoal for text over gold

  // Borders & dividers — hairlines, never heavy gold boxes
  border: 'rgba(255, 255, 255, 0.08)',
  borderLight: 'rgba(255, 255, 255, 0.12)',
  divider: 'rgba(255, 255, 255, 0.07)',
  goldSoft: 'rgba(212, 175, 124, 0.14)',
  goldHairline: 'rgba(212, 175, 124, 0.22)',

  // Category colors
  heritage: '#D4AF7C',
  museum: '#8B6FC0',
  culture: '#5B8FB9',
  food: '#E67E5A',
  activity: '#4CAF50',

  // Gradients (as arrays for LinearGradient)
  gradientPrimary: ['#D4AF7C', '#A8864F'],
  gradientHero: ['#0F0F0F', '#171717', '#0F0F0F'],
  gradientCard: ['#1D1D1D', '#171717'],
  gradientOverlay: ['transparent', 'rgba(15, 15, 15, 0.75)', '#0F0F0F'],
};

export const Typography = {
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    serif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string,
  },
  sizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 20,
    xl: 24,
    '2xl': 30,
    '3xl': 36,
    '4xl': 48,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },
  // Editorial hierarchy — serif only for storytelling headings
  editorial: {
    eyebrow: { size: 11, letterSpacing: 1.4, weight: '700' as const },
    display: { size: 32, lineHeight: 38 },
    title: { size: 24, lineHeight: 30 },
    quote: { size: 17, lineHeight: 26 },
    body: { size: 15, lineHeight: 24 },
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const BorderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  full: 999,
};

// Consistent 4pt rhythm. Sections breathe: 24–32 between sections, 16 page margin.
export const Rhythm = {
  pageMargin: 20,
  sectionGap: 32,
  cardGap: 12,
  hairline: 1,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  // Restrained, subtle elevation (no radioactive neon glow)
  glow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
};

// Category configuration
export const CATEGORIES = [
  { key: 'heritage', label: 'Heritage', icon: 'account-balance', color: Colors.heritage },
  { key: 'museum', label: 'Museums', icon: 'museum', color: Colors.museum },
  { key: 'culture', label: 'Culture', icon: 'palette', color: Colors.culture },
  { key: 'food', label: 'Food', icon: 'restaurant', color: Colors.food },
  { key: 'activity', label: 'Activities', icon: 'directions-walk', color: Colors.activity },
] as const;

// Automatically detect host IP from Expo bundler connection (Expo Go on physical devices)
const expoHostUri =
  Constants.expoConfig?.hostUri ||
  (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
  (Constants as any).manifest?.debuggerHost;

const detectedHostIp = expoHostUri ? expoHostUri.split(':')[0] : null;

// Auto-resolves: On web always use localhost (or window.location.hostname) to prevent network errors.
// On physical mobile devices (Expo Go), auto-resolve to dev machine LAN IP.
export const API_BASE_URL = Platform.OS === 'web'
  ? (typeof window !== 'undefined' && window.location.hostname
      ? `http://${window.location.hostname}:3000`
      : 'http://localhost:3000')
  : (detectedHostIp ? `http://${detectedHostIp}:3000` : 'http://localhost:3000');

// Language configuration
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
] as const;

// Onboarding options
export const INTERESTS_OPTIONS = [
  { key: 'heritage', label: 'Heritage Sites', icon: '🏛️' },
  { key: 'museum', label: 'Museums', icon: '🖼️' },
  { key: 'culture', label: 'Culture & Art', icon: '🎨' },
  { key: 'food', label: 'Local Food', icon: '🍽️' },
  { key: 'activity', label: 'Activities', icon: '🥾' },
] as const;

export const TRAVEL_STYLES = [
  { key: 'rushed', label: 'Quick Explorer', description: 'See more, spend less time', icon: '⚡' },
  { key: 'moderate', label: 'Balanced', description: 'Perfect mix of exploring and learning', icon: '⚖️' },
  { key: 'leisurely', label: 'Deep Diver', description: 'Take your time, learn everything', icon: '🧘' },
] as const;

export const DURATION_OPTIONS = [
  { key: '30min', label: '30 min', description: 'Quick visit' },
  { key: '90min', label: '90 min', description: 'Standard tour' },
  { key: 'half-day', label: 'Half Day', description: '4 hours' },
  { key: 'full-day', label: 'Full Day', description: '8 hours' },
] as const;

export const CATEGORY_COLORS: Record<string, string> = {
  heritage: Colors.heritage,
  museum: Colors.museum,
  culture: Colors.culture,
  food: Colors.food,
  activity: Colors.activity,
};

// High-End Editorial Auth Palette (Reference Design)
export const AuthTheme = {
  background: '#0F0F0F',
  surface: '#161616',
  surfaceElevated: '#1E1E1E',
  gold: '#D4AF7C',
  goldDark: '#A8864F',
  goldLight: '#E5C9A4',
  textPrimary: '#F5F1E8',
  textSecondary: '#A7A7A7',
  textMuted: '#777777',
  border: 'rgba(255, 255, 255, 0.10)',
  borderLight: 'rgba(255, 255, 255, 0.14)',
  borderFocus: '#D4AF7C',
  inputBg: '#161616',
  fontSerif: Platform.select({ ios: 'Georgia', android: 'serif', default: 'serif' }) as string,
};
