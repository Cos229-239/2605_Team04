/**
 * PARENTVAULT-COMMENTARY
 *
 * Today dashboard: the daily command center for custody, school, reminders, medication, urgent journal prompts, quick logging,
 * specific-info sharing, AI helper prompts, and export readiness.
 *
 * This is intentionally a first production scaffold: every requested feature has a visible starting point without hiding logic in App.tsx.
 */

import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
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

const formatWhen = (iso: string) => new Date(iso).toLocaleString(undefined, { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

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
        <View style={styles.typeGrid}>{quickLogTypes.map(type => <PrimaryButton key={type.type} tone={quickType === type.type ? 'primary' : 'quiet'} onPress={() => setQuickType(type.type)}>{type.label}</PrimaryButton>)}</View>
        <TextInput value={quickText} onChangeText={setQuickText} placeholder="What happened? Keep it factual." placeholderTextColor={theme.subtle} style={styles.input} multiline />
        <PrimaryButton onPress={saveQuickLog}>Save Quick Log</PrimaryButton>
        {status ? <Text style={styles.status}>{status}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Ask Nanny</Text>
        <View style={styles.actionGrid}>
          <PrimaryButton tone="quiet" onPress={() => runAiPrompt('What do I need to know today?')}>What do I need today?</PrimaryButton>
          <PrimaryButton tone="quiet" onPress={() => runAiPrompt('Summarize this week for my child.')}>Summarize this week</PrimaryButton>
          <PrimaryButton tone="quiet" onPress={() => runAiPrompt('What should I ask the teacher or doctor?')}>Questions to ask</PrimaryButton>
        </View>
        {aiPreview ? <Text style={styles.preview}>{aiPreview}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Share specific info</Text>
        <Text style={styles.help}>Start safe: share selected facts only, not the whole vault.</Text>
        <PrimaryButton onPress={previewShare}>Preview caregiver share</PrimaryButton>
        {sharePreview ? <Text style={styles.preview}>{sharePreview}</Text> : null}
      </Card>

      <Card>
        <Text style={styles.sectionTitle}>Court/export readiness</Text>
        <Text style={styles.help}>Journal exports should stay factual, ordered, timestamped, and attachment-aware.</Text>
        <PrimaryButton onPress={previewCourtExport}>Preview export package</PrimaryButton>
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
