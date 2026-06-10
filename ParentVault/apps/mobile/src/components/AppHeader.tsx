/**
 * AppHeader
 *
 * Slim global trust banner for the ParentVault mobile shell.
 * It gives the app a consistent product frame without stealing much vertical space.
 */

import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

export function AppHeader() {
  const theme = useTheme();

  return (
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border, shadowColor: theme.shadow }]}>
      <View>
        <Text style={[styles.brand, { color: theme.text }]}>ParentVault</Text>
        <Text style={[styles.tagline, { color: theme.muted }]}>Child info, reminders, and records - calmer.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    minHeight: 64,
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    zIndex: 2
  },
  brand: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.3
  },
  tagline: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2
  }
});
