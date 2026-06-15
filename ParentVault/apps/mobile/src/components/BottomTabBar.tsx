/**
 * BottomTabBar
 *
 * Reusable tab buttons for the ParentVault app shell.
 * The tab definitions come from ../navigation/tabs.tsx, so this component only worries about
 * display and user interaction.
 */

import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { AppTab, TabKey } from '../navigation/tabs';
import { useTheme } from '../theme';

const tabIcons: Record<TabKey, string> = {
  today: '⭐',
  profiles: '👶',
  schedule: '📅',
  chat: '💬',
  import: '📥',
  journal: '📝',
  security: '⚙️'
};

interface BottomTabBarProps {
  tabs: AppTab[];
  activeTab: TabKey;
  onChangeTab: (tab: TabKey) => void;
}

export function BottomTabBar({ tabs, activeTab, onChangeTab }: BottomTabBarProps) {
  const theme = useTheme();

  return (
    <View style={[styles.tabs, { backgroundColor: theme.surface, borderTopColor: theme.border, shadowColor: theme.shadow }]}> 
      {tabs.map(item => {
        const selected = activeTab === item.key;

        return (
          <Pressable
            key={item.key}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            accessibilityLabel={`Open ${item.label}`}
            onPress={() => onChangeTab(item.key)}
            style={({ pressed }) => [
              styles.tab,
              { borderColor: selected ? theme.primary : 'transparent', opacity: pressed ? 0.82 : 1, transform: [{ translateY: selected ? -2 : 0 }] },
              selected && { backgroundColor: theme.primarySoft }
            ]}
          >
            <Text style={styles.tabIcon}>{tabIcons[item.key]}</Text>
            <Text numberOfLines={1} style={[styles.tabText, { color: selected ? theme.primary : theme.subtle }]}>{item.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', padding: 10, gap: 6, borderTopWidth: 1, shadowOpacity: 0.16, shadowRadius: 18, shadowOffset: { width: 0, height: -6 }, elevation: 12 },
  tab: { flex: 1, minHeight: 52, borderRadius: 18, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  tabIcon: { fontSize: 17, marginBottom: 2 },
  tabText: { fontSize: 10, fontWeight: '800' }
});
