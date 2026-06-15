/**
 * PARENTVAULT-COMMENTARY
 *
 * Today dashboard: the daily command center for custody, school, reminders, medication, urgent journal prompts, quick logging,
 * specific-info sharing, AI helper prompts, and export readiness.
 *
 * This is intentionally a first production scaffold: every requested feature has a visible starting point without hiding logic in App.tsx.
 */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { JournalEntryType } from '@parentvault/shared';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { buildJournalExportManifest, makeDefaultJournalExportRequest } from '../services/journalExport';
import { buildSpecificSharePreview, defaultShareFields } from '../services/sharePack';
import { getScheduleUrgency, urgencyCopy, type UrgencyLevel } from '../services/urgency';
import { useVaultStore } from '../store/vaultStore';
import { useTheme } from '../theme';

const quickLogTypes: { label: string; type: JournalEntryType; template: string }[] = [
  { label: 'Behavior', type: 'behavior', template: 'Behavior note' },
  { label: 'Medication', type: 'medication', template: 'Medication note' },
  { label: 'Expense', type: 'expense', template: 'Expense note' },
  { label: 'Custody issue', type: 'custody', template: 'Custody note' },
  { label: 'School note', type: 'school', template: 'School note' },
  { label: 'Medical', type: 'medical', template: 'Medical note' }
];

const quickLogMeta: Record<JournalEntryType, { color: string; soft: string; text: string }> = {
  general: { color: '#64748b', soft: '#f1f5f9', text: '#334155' },
  behavior: { color: '#10b981', soft: '#d1fae5', text: '#065f46' },
  medication: { color: '#f97316', soft: '#ffedd5', text: '#9a3412' },
  expense: { color: '#14b8a6', soft: '#ccfbf1', text: '#115e59' },
  custody: { color: '#8b5cf6', soft: '#ede9fe', text: '#4c1d95' },
  school: { color: '#2563eb', soft: '#dbeafe', text: '#1e3a8a' },
  medical: { color: '#ef4444', soft: '#fee2e2', text: '#991b1b' },
  communication: { color: '#0ea5e9', soft: '#e0f2fe', text: '#075985' },
  appointment: { color: '#ef4444', soft: '#fee2e2', text: '#991b1b' },
  other: { color: '#64748b', soft: '#f1f5f9', text: '#334155' }
};

const actionMeta = {
  today: { color: '#8b5cf6', soft: '#ede9fe', text: '#4c1d95' },
  week: { color: '#2563eb', soft: '#dbeafe', text: '#1e3a8a' },
  questions: { color: '#ef4444', soft: '#fee2e2', text: '#991b1b' },
  share: { color: '#10b981', soft: '#d1fae5', text: '#065f46' },
  export: { color: '#f97316', soft: '#ffedd5', text: '#9a3412' }
};

const formatWhen = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

function ColorActionButton({ label, active = false, meta, onPress }: { label: string; active?: boolean; meta: { color: string; soft: string; text: string }; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [stylesStatic.colorButton, { backgroundColor: active ? meta.color : meta.soft, borderColor: meta.color, opacity: pressed ? 0.86 : 1 }]}
    >
      <View style={[stylesStatic.colorButtonDot, { backgroundColor: active ? '#ffffff' : meta.color }]} />
      <Text style={[stylesStatic.colorButtonText, { color: active ? '#ffffff' : meta.text }]}>{label}</Text>
    </Pressable>
  );
}

export function TodayScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);

  const children = useVaultStore(s => s.children);
  const schedule = useVaultStore(s => s.schedule);
  const journal = useVaultStore(s => s.journal);
  const addJournalEntry = useVaultStore(s => s.addJournalEntry);
  const askVault = useVaultStore(s => s.askVault);

  const firstChild = children[0];
  const [quickType, setQuickType] = useState<JournalEntryType>('general');
  const [quickText, setQuickText] = useState('');
  const [status, setStatus] = useState('');
  const [sharePreview, setSharePreview] = useState('');
  const [aiPreview, setAiPreview] = useState('');
  const [exportPreview, setExportPreview] = useState('');

  const upcoming = useMemo(() => [...schedule]
    .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
    .slice(0, 5), [schedule]);

  const urgencyCounts = useMemo(() => upcoming.reduce<Record<UrgencyLevel, number>>((counts, item) => {
    counts[getScheduleUrgency(item.startsAt, item.takenAt)] += 1;
    return counts;
  }, { red: 0, yellow: 0, green: 0 }), [upcoming]);

  const saveQuickLog = () => {
    const clean = quickText.trim();
    if (!clean) {
      setStatus('Write one sentence first. Faster than texting yourself, but not psychic yet.');
      return;
    }

    const createdAt = new Date().toISOString();
    addJournalEntry({
      childId: firstChild?.id,
      type: quickType,
      occurredAt: createdAt,
      occurredAtPrecision: 'exact',
      title: quickLogTypes.find(type => type.type === quickType)?.template ?? 'Quick log',
      notes: clean,
      attachments: [],
      tags: ['quick-log', quickType],
      audit: {
        createdAt,
        updatedAt: createdAt,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        entryOrder: journal.length + 1,
        userSuppliedOccurredAt: false,
        source: 'manual'
      }
    });
    setQuickText('');
    setStatus('Quick log saved to Journal with timestamp metadata.');
  };

  const runAiPrompt = (prompt: string) => {
    const answer = askVault(prompt);
    setAiPreview(`${answer.answer}${answer.sources.length ? `\n\nSources: ${answer.sources.slice(0, 3).map(source => source.title).join(', ')}` : ''}`);
  };

  const previewShare = () => setSharePreview(buildSpecificSharePreview(firstChild, defaultShareFields));

  const previewCourtExport = () => {
    const manifest = buildJournalExportManifest(journal, makeDefaultJournalExportRequest(firstChild?.id));
    setExportPreview(`Court/export preview: ${manifest.entryCount} entries, ${manifest.attachmentCount} attachments, ${manifest.warnings.length} warning(s). Includes event date, created date, audit order, and attachment IDs.`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Today</Text>
      <Text style={styles.subtitle}>Your daily ParentVault command center: what matters now, what needs logging, what can be shared, and what is ready to export.</Text>

      <Card>
        <Text style={styles.sectionTitle}>At a glance</Text>
        <View style={styles.urgencyRow}>
          {(['red', 'yellow', 'green'] as UrgencyLevel[]).map(level => <View key={level} style={[styles.urgencyPill, { backgroundColor: urgencyCopy[level].background }]}><Text style={[styles.urgencyText, { color: urgencyCopy[level].color }]}>{urgencyCounts[level]} {urgencyCopy[level].label}</Text></View>)}
        </View>
        {upcoming.length ? upcoming.map(item => {
          const urgency = getScheduleUrgency(item.startsAt, item.takenAt);
          return (
            <View key={item.id} style={styles.todayItem}>
              <View style={[styles.dot, { backgroundColor: urgencyCopy[urgency].color }]} />
              <View style={styles.todayItemText}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemMeta}>{formatWhen(item.startsAt)} · {item.type}</Text>
              </View>
            </View>
          );
        }) : <Text style={styles.help}>No upcoming schedule items yet. Add custody, school, meds, or appointments so Today has something useful to watch.</Text>}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Quick Log</Text>
        <Text style={styles.help}>Capture a useful record faster than texting yourself.</Text>
        <View style={styles.typeGrid}>{quickLogTypes.map(type => <ColorActionButton key={type.type} label={type.label} active={quickType === type.type} meta={quickLogMeta[type.type]} onPress={() => setQuickType(type.type)} />)}</View>
        <TextInput value={quickText} onChangeText={setQuickText} placeholder="What happened? Keep it factual." placeholderTextColor={theme.subtle} style={styles.input} multiline />
        <PrimaryButton onPress={saveQuickLog}>Save Quick Log</PrimaryButton>
        {status ? <Text style={styles.status}>{status}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Ask Nanny</Text>
        <View style={styles.actionGrid}>
          <ColorActionButton label="What do I need today?" meta={actionMeta.today} onPress={() => runAiPrompt('What do I need to know today?')} />
          <ColorActionButton label="Summarize this week" meta={actionMeta.week} onPress={() => runAiPrompt('Summarize this week for my child.')} />
          <ColorActionButton label="Questions to ask" meta={actionMeta.questions} onPress={() => runAiPrompt('What should I ask the teacher or doctor?')} />
        </View>
        {aiPreview ? <Text style={styles.preview}>{aiPreview}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Share specific info</Text>
        <Text style={styles.help}>Start safe: share selected facts only, not the whole vault.</Text>
        <ColorActionButton label="Preview caregiver share" meta={actionMeta.share} onPress={previewShare} />
        {sharePreview ? <Text style={styles.preview}>{sharePreview}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Court/export readiness</Text>
        <Text style={styles.help}>Journal exports should stay factual, ordered, timestamped, and attachment-aware.</Text>
        <ColorActionButton label="Preview export package" meta={actionMeta.export} onPress={previewCourtExport} />
        {exportPreview ? <Text style={styles.preview}>{exportPreview}</Text> : null}
      </Card>
    </ScrollView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { padding: 18, paddingBottom: 34 },
  title: { fontSize: 34, fontWeight: '900', color: theme.text, letterSpacing: -0.8, marginTop: 4 },
  subtitle: { color: theme.muted, marginTop: 6, marginBottom: 18, lineHeight: 21 },
  sectionTitle: { color: theme.text, fontSize: 20, fontWeight: '900', marginBottom: 8 },
  help: { color: theme.muted, lineHeight: 20 },
  urgencyRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  urgencyPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  urgencyText: { fontWeight: '900', fontSize: 12 },
  todayItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderTopWidth: 1, borderTopColor: theme.border },
  dot: { width: 12, height: 12, borderRadius: 999 },
  todayItemText: { flex: 1 },
  itemTitle: { color: theme.text, fontWeight: '900', fontSize: 16 },
  itemMeta: { color: theme.subtle, marginTop: 2 },
  typeGrid: { gap: 2, marginBottom: 8 },
  actionGrid: { gap: 2 },
  input: { minHeight: 96, borderRadius: 16, borderWidth: 1, borderColor: theme.inputBorder, padding: 12, backgroundColor: theme.input, color: theme.text, marginTop: 8 },
  status: { color: theme.primary, fontWeight: '800', marginTop: 8 },
  preview: { color: theme.text, backgroundColor: theme.input, borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 12, lineHeight: 20, marginTop: 10 }
});

const stylesStatic = StyleSheet.create({
  colorButton: {
    minHeight: 48,
    borderRadius: 999,
    borderWidth: 2,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 8
  },
  colorButtonDot: { width: 10, height: 10, borderRadius: 999 },
  colorButtonText: { fontWeight: '900', fontSize: 15, textAlign: 'center' }
});
