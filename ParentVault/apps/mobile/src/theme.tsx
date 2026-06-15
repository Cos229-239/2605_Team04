/**
 * PARENTVAULT-COMMENTARY
 *
 * Shared theme provider and color tokens for dark/light mode.
 *
 * Centralizing tokens prevents scattered hard-coded colors and keeps accessibility improvements manageable.
 *
 * Use useTheme() in components so future theme/security styling changes apply consistently.
 *
 * Reading guide:
 * - Comments in this project explain product intent, privacy/security boundaries, and why a flow exists.
 * - They are deliberately more detailed than normal production comments because this app is being shared for learning, review, and handoff.
 * - If code and comments ever disagree, fix both together; stale privacy/security comments are dangerous.
 */

import { createContext, PropsWithChildren, useContext } from 'react';

export type ThemeMode = 'dark' | 'light';

export const palette = {
  dark: {
    mode: 'dark' as const,
    app: '#07111f',
    surface: '#0d1b2f',
    elevated: '#13223a',
    card: '#101f35',
    border: '#263955',
    text: '#f8fafc',
    muted: '#cbd5e1',
    subtle: '#94a3b8',
    warning: '#fbbf24',
    primary: '#8ab4ff',
    primaryStrong: '#3b82f6',
    primarySoft: '#193b68',
    input: '#091426',
    inputBorder: '#3a506f',
    shadow: '#000000'
  },
  light: {
    mode: 'light' as const,
    app: '#f3f6fb',
    surface: '#ffffff',
    elevated: '#e5e7eb',
    card: '#ffffff',
    border: '#9ca3af',
    text: '#020617',
    muted: '#111827',
    subtle: '#374151',
    warning: '#7c2d12',
    primary: '#1d4ed8',
    primaryStrong: '#1e3a8a',
    primarySoft: '#dbeafe',
    input: '#ffffff',
    inputBorder: '#6b7280',
    shadow: '#111827'
  }
};

export type Theme = (typeof palette)[ThemeMode];

const ThemeContext = createContext<Theme>(palette.dark);

export function ThemeProvider({ mode, children }: PropsWithChildren<{ mode: ThemeMode }>) {
  return <ThemeContext.Provider value={palette[mode]}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
