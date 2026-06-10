/**
 * AppModal
 *
 * Shared polished modal shell for ParentVault pop-ups.
 * It keeps dense forms from feeling like raw debug panels by adding a dim backdrop,
 * clear header, scrollable body, and a consistent action area.
 */

import { PropsWithChildren, ReactNode } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

interface AppModalProps extends PropsWithChildren {
  visible: boolean;
  eyebrow?: string;
  title: string;
  description?: string;
  onClose: () => void;
  footer?: ReactNode;
}

export function AppModal({ visible, eyebrow, title, description, onClose, footer, children }: AppModalProps) {
  const theme = useTheme();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.card, borderColor: theme.border, shadowColor: theme.shadow }]}> 
          <View style={[styles.handle, { backgroundColor: theme.border }]} />
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              {eyebrow ? <Text style={[styles.eyebrow, { color: theme.primary }]}>{eyebrow}</Text> : null}
              <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
              {description ? <Text style={[styles.description, { color: theme.muted }]}>{description}</Text> : null}
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Close ${title}`}
              hitSlop={10}
              onPress={onClose}
              style={({ pressed }) => [styles.closeButton, { borderColor: theme.border, backgroundColor: pressed ? theme.primarySoft : theme.input }]}
            >
              <Text style={[styles.closeText, { color: theme.text }]}>×</Text>
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            {children}
          </ScrollView>
          {footer ? <View style={[styles.footer, { borderTopColor: theme.border }]}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(2, 6, 23, 0.68)',
    paddingHorizontal: 12,
    paddingTop: 44
  },
  sheet: {
    maxHeight: '94%',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    borderWidth: 1,
    overflow: 'hidden',
    shadowOpacity: 0.26,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -10 },
    elevation: 14
  },
  handle: {
    width: 48,
    height: 5,
    borderRadius: 999,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 18,
    paddingBottom: 12
  },
  headerCopy: { flex: 1 },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.9,
    textTransform: 'uppercase'
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 3
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '700',
    marginTop: 6
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  closeText: {
    fontSize: 30,
    lineHeight: 32,
    fontWeight: '700'
  },
  content: {
    paddingHorizontal: 18,
    paddingBottom: 16
  },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 18,
    gap: 8
  }
});
