/**
 * PARENTVAULT-COMMENTARY
 *
 * Reusable visual container for grouped UI content across screens.
 *
 * Cards keep the interface consistent and make dark-mode styling easier to maintain.
 *
 * Use this instead of ad-hoc boxes when presenting profile, schedule, import, journal, or settings sections.
 *
 * Reading guide:
 * - Comments in this project explain product intent, privacy/security boundaries, and why a flow exists.
 * - They are deliberately more detailed than normal production comments because this app is being shared for learning, review, and handoff.
 * - If code and comments ever disagree, fix both together; stale privacy/security comments are dangerous.
 */

import { PropsWithChildren } from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

export function Card({ children }: PropsWithChildren) {
  const theme = useTheme();
  return <View style={[styles.card, { backgroundColor: theme.card, shadowColor: theme.shadow, borderColor: theme.border, shadowOpacity: theme.mode === 'light' ? 0.12 : 0.14 }]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 2,
    borderRadius: 24,
    padding: 18,
    marginBottom: 14,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3
  }
});
