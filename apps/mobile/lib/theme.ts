/**
 * Colour tokens for light and dark themes.
 *
 * Every screen builds its StyleSheet from these via `useThemedStyles(makeStyles)`
 * (see contexts/theme.tsx). Never hard-code a hex in a component — add a token
 * here instead. The one exception is colour drawn *over a photo* (hero scrim,
 * garment placeholder swatches), which is theme-independent by nature.
 */

export interface ThemeColors {
  /** app / screen background */
  background: string;
  /** raised card / sheet surface */
  surface: string;
  /** subtle tinted surface (pills, inset rows, AI card) */
  surfaceAlt: string;
  /** primary text + primary (charcoal) button background */
  foreground: string;
  /** text that sits on `foreground` (i.e. on the charcoal button) */
  onForeground: string;
  /** secondary / caption text, inactive icons */
  muted: string;
  /** hairlines, card borders, dividers */
  border: string;
  /** brand mauve — accents, active states, primary rounded buttons */
  accent: string;
  /** deeper mauve — pressed / secondary accent */
  accentDark: string;
  /**
   * Mauve calibrated for text/icons on a light surface (≥4.5:1, WCAG AA) —
   * `accent` itself is too light for that (≈2.2:1 on white). Use this for
   * any accent-colored label, link, or small caps text; keep `accent` for
   * backgrounds/fills, where it's checked against `onAccent` instead.
   */
  accentText: string;
  /** text/icon on an `accent` fill */
  onAccent: string;
  /** modal / sheet scrim */
  overlay: string;
  /** text input background */
  inputBg: string;
  /** destructive text / icons */
  danger: string;
  success: string;
  warning: string;
  /** white when over the hero photo — stays light in both themes */
  onImage: string;
}

export const lightColors: ThemeColors = {
  background: '#FAFAFA',
  surface: '#FFFFFF',
  surfaceAlt: '#F5F0ED',
  foreground: '#1A1A1A',
  onForeground: '#FFFFFF',
  // Was #8C8C8C — only ~3.2:1 on background/surface and ~3:1 on surfaceAlt,
  // below the 4.5:1 WCAG AA minimum for normal-size text. This passes ~5:1+
  // against every light-mode surface.
  muted: '#666666',
  border: '#E8E2DE',
  accent: '#C9A99A',
  accentDark: '#A07B6F',
  accentText: '#8A6358',
  onAccent: '#FFFFFF',
  overlay: 'rgba(20,17,15,0.45)',
  inputBg: '#FFFFFF',
  danger: '#E05C5C',
  success: '#4CAF82',
  warning: '#E8A838',
  onImage: '#FFFFFF',
};

export const darkColors: ThemeColors = {
  background: '#141110',
  surface: '#1E1A17',
  surfaceAlt: '#262019',
  foreground: '#F2ECE6',
  onForeground: '#1A1A1A',
  // Already ~5.1:1+ against every dark-mode surface — no change needed here.
  muted: '#9A8F86',
  border: '#332D27',
  accent: '#C9A99A',
  accentDark: '#B58B7B',
  // accent is already ~8.6:1 against dark backgrounds, so it's fine as
  // text here too — unlike light mode, no darker variant is needed.
  accentText: '#C9A99A',
  // accent is the same mauve in both themes, so keep its text white in both
  onAccent: '#FFFFFF',
  overlay: 'rgba(0,0,0,0.6)',
  inputBg: '#262019',
  danger: '#E97A7A',
  success: '#5FC998',
  warning: '#E8B45C',
  onImage: '#FFFFFF',
};

export type ThemeMode = 'system' | 'light' | 'dark';
export type ColorScheme = 'light' | 'dark';

export const colorsFor = (scheme: ColorScheme): ThemeColors =>
  scheme === 'dark' ? darkColors : lightColors;
