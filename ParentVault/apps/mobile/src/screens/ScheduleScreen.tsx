/**
 * PARENTVAULT-COMMENTARY
 *
 * Schedule/reminders screen for custody, school, events, therapy, medications, pickup timing, journal prompts, and monthly planning.
 *
 * It previews Nanny-style reminder rules and lets parents schedule local alerts or mark medication as taken.
 *
 * Sensitive reminder notifications should use generic lock-screen text unless a parent explicitly opts into details.
 */

import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { NotificationOffset, ScheduleItem, ScheduleType } from '@parentvault/shared';
import { AppModal } from '../components/AppModal';
import { Card } from '../components/Card';
import { ChoiceChip } from '../components/ChoiceChip';
import { FormField } from '../components/FormField';
import { PrimaryButton } from '../components/PrimaryButton';
import { previewNannyStandingReminders, previewNannyStyleAlerts, scheduleLocalAlerts } from '../services/notifications';
import { useVaultStore } from '../store/vaultStore';
import { useTheme } from '../theme';

const weekdayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const typeMeta: Record<ScheduleType, { label: string; color: string; soft: string; text: string }> = {
  custody: { label: 'Custody', color: '#8b5cf6', soft: '#ede9fe', text: '#4c1d95' },
  school: { label: 'School', color: '#2563eb', soft: '#dbeafe', text: '#1e3a8a' },
  appointment: { label: 'Medical', color: '#ef4444', soft: '#fee2e2', text: '#991b1b' },
  medication: { label: 'Medication', color: '#f97316', soft: '#ffedd5', text: '#9a3412' },
  event: { label: 'Event', color: '#10b981', soft: '#d1fae5', text: '#065f46' }
};

const quickEventTypes: { label: string; type: ScheduleType; title: string }[] = [
  { label: 'Custody', type: 'custody', title: 'Custody exchange' },
  { label: 'School', type: 'school', title: 'School event' },
  { label: 'Doctor', type: 'appointment', title: 'Appointment' },
  { label: 'Meds', type: 'medication', title: 'Medication reminder' },
  { label: 'Other', type: 'event', title: 'Event' }
];

const monthTitle = (date: Date) => date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
const dateKey = (date: Date) => date.toISOString().slice(0, 10);
const formatUsShortDate = (date: Date) => `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(-2)}`;

const buildMonthDays = (monthDate: Date) => {
  const firstDay = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const lastDay = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0);
  const days: (Date | null)[] = [];

  for (let index = 0; index < firstDay.getDay(); index += 1) days.push(null);
  for (let day = 1; day <= lastDay.getDate(); day += 1) days.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  while (days.length % 7 !== 0) days.push(null);

  return days;
};

const shortEventTitle = (title: string) => title.trim().length <= 12 ? title.trim() : `${title.trim().slice(0, 11)}...`;

const parseList = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean);

const parseUsEventDateTime = (dateValue: string, timeValue: string) => {
  const dateText = dateValue.trim();
  const timeText = timeValue.trim().toLowerCase().replace(/\s+/g, '');
  const dateMatch = dateText.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  const timeMatch = timeText.match(/^(\d{1,2})(?::(\d{2}))?(am|pm)?$/);
  if (!dateMatch || !timeMatch) return null;

  const month = Number(dateMatch[1]) - 1;
  const day = Number(dateMatch[2]);
  const rawYear = Number(dateMatch[3]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  let hour = Number(timeMatch[1]);
  const minute = Number(timeMatch[2] ?? '0');
  const meridiem = timeMatch[3];

  if (month < 0 || month > 11 || day < 1 || day > 31 || minute > 59) return null;
  if (meridiem) {
    if (hour < 1 || hour > 12) return null;
    if (meridiem === 'pm' && hour !== 12) hour += 12;
    if (meridiem === 'am' && hour === 12) hour = 0;
  } else if (hour > 23) return null;

  const parsed = new Date(year, month, day, hour, minute);
  return parsed.getFullYear() === year && parsed.getMonth() === month && parsed.getDate() === day ? parsed : null;
};

const reminderLabel = (offset: NotificationOffset) => {
  if (offset === 'day_before') return 'Day before';
  if (offset === 'day_of') return 'Morning of';
  if (offset === 'hour_before') return '1 hour before';
  const minutes = offset.customMinutesBefore;
  if (minutes % 1440 === 0) return `${minutes / 1440} day${minutes === 1440 ? '' : 's'} before`;
  if (minutes % 60 === 0) return `${minutes / 60} hour${minutes === 60 ? '' : 's'} before`;
  return `${minutes} minutes before`;
};

const formatOffset = (offset: NotificationOffset) => {
  if (offset === 'day_before') return 'day before';
  if (offset === 'day_of') return 'morning of';
  if (offset === 'hour_before') return 'hour before';
  return `${offset.customMinutesBefore} min before`;
};

const sourceLabel = (item: ScheduleItem) => {
  if (!item.source) return 'Manual';
  if (item.source === 'text') return item.confidence && item.confidence < 1 ? 'Text draft - review' : 'Manual/text';
  return `${item.source} draft - review`;
};

type ReminderDraft = { id: string; minutesBefore: string };

type EventDraft = {
  title: string;
  type: ScheduleType;
  childId: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  custodyHolder: string;
  bringList: string;
  notes: string;
  dayBefore: boolean;
  dayOf: boolean;
  hourBefore: boolean;
  customReminders: ReminderDraft[];
};

const newReminderDraft = (): ReminderDraft => ({ id: `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, minutesBefore: '' });

const defaultEventDraft = (date = new Date()): EventDraft => ({
  title: '',
  type: 'event',
  childId: '',
  date: formatUsShortDate(date),
  startTime: '5pm',
  endTime: '',
  location: '',
  custodyHolder: '',
  bringList: '',
  notes: '',
  dayBefore: true,
  dayOf: true,
  hourBefore: true,
  customReminders: []
});

export function ScheduleScreen() {
  const theme = useTheme();
  const styles = createStyles(theme);

  const schedule = useVaultStore(s => s.schedule);
  const children = useVaultStore(s => s.children);
  const addScheduleItem = useVaultStore(s => s.addScheduleItem);
  const removeScheduleItem = useVaultStore(s => s.removeScheduleItem);
  const markMedicationTaken = useVaultStore(s => s.markMedicationTaken);

  const [alertStatus, setAlertStatus] = useState<Record<string, string>>({});
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventDraft, setEventDraft] = useState<EventDraft>(() => defaultEventDraft(new Date(Date.now() + 24 * 60 * 60 * 1000)));
  const [eventFormStatus, setEventFormStatus] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const onboardingTips = [
    'Try adding your first custody pickup or school run.',
    'Add what to bring: backpack, meds, uniform, insurance card, or court paperwork.',
    'Use colors to scan custody, school, medical, medication, and general events fast.'
  ];

  const sortedSchedule = useMemo(
    () => [...schedule].sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime()),
    [schedule]
  );
  const upcomingSchedule = useMemo(
    () => sortedSchedule.filter(item => new Date(item.startsAt).getTime() >= Date.now()).slice(0, 7),
    [sortedSchedule]
  );
  const calendarMonth = useMemo(() => new Date(), []);
  const monthDays = useMemo(() => buildMonthDays(calendarMonth), [calendarMonth]);
  const eventsByDate = useMemo(() => sortedSchedule.reduce<Record<string, ScheduleItem[]>>((groups, item) => {
    const key = dateKey(new Date(item.startsAt));
    groups[key] = [...(groups[key] ?? []), item];
    return groups;
  }, {}), [sortedSchedule]);

  const childName = (childId?: string) => children.find(child => child.id === childId)?.displayName || 'All children';
  const setEventField = <K extends keyof EventDraft>(key: K, value: EventDraft[K]) => setEventDraft(current => ({ ...current, [key]: value }));
  const toggleReminder = (key: 'dayBefore' | 'dayOf' | 'hourBefore') => setEventDraft(current => ({ ...current, [key]: !current[key] }));
  const addCustomReminder = () => setEventDraft(current => ({ ...current, customReminders: [...current.customReminders, newReminderDraft()] }));
  const updateCustomReminder = (reminderId: string, minutesBefore: string) => setEventDraft(current => ({
    ...current,
    customReminders: current.customReminders.map(reminder => reminder.id === reminderId ? { ...reminder, minutesBefore } : reminder)
  }));
  const removeCustomReminder = (reminderId: string) => setEventDraft(current => ({ ...current, customReminders: current.customReminders.filter(reminder => reminder.id !== reminderId) }));

  const openEventForm = (day?: Date) => {
    setEventDraft(defaultEventDraft(day ?? new Date()));
    setEventFormStatus('');
    setShowEventForm(true);
  };

  const chooseQuickEventType = (option: typeof quickEventTypes[number]) => {
    setEventDraft(current => ({
      ...current,
      type: option.type,
      title: current.title.trim() ? current.title : option.title,
      custodyHolder: option.type === 'custody' ? current.custodyHolder || 'Parent / caregiver' : current.custodyHolder
    }));
  };

  const buildNotificationOffsets = (): NotificationOffset[] => [
    eventDraft.dayBefore ? 'day_before' as const : null,
    eventDraft.dayOf ? 'day_of' as const : null,
    eventDraft.hourBefore ? 'hour_before' as const : null,
    ...eventDraft.customReminders.map(reminder => {
      const minutes = Number(reminder.minutesBefore.replace(/[^0-9]/g, ''));
      return minutes > 0 ? { customMinutesBefore: minutes } : null;
    })
  ].filter((offset): offset is NotificationOffset => Boolean(offset));

  const saveEventDraft = () => {
    const start = parseUsEventDateTime(eventDraft.date, eventDraft.startTime);
    const end = eventDraft.endTime.trim() ? parseUsEventDateTime(eventDraft.date, eventDraft.endTime) : null;
    if (!eventDraft.title.trim()) {
      setEventFormStatus('Add an event title before saving.');
      return;
    }
    if (!start) {
      setEventFormStatus('Add a valid date and start time, like 5/28/26 and 5pm.');
      return;
    }

    addScheduleItem({
      childId: eventDraft.childId || undefined,
      type: eventDraft.type,
      title: eventDraft.title.trim(),
      startsAt: start.toISOString(),
      endsAt: end ? end.toISOString() : undefined,
      location: eventDraft.location.trim() || undefined,
      custodyHolder: eventDraft.custodyHolder.trim() || undefined,
      bringList: parseList(eventDraft.bringList),
      notes: eventDraft.notes.trim() || undefined,
      notificationOffsets: buildNotificationOffsets(),
      source: 'text'
    });
    setEventDraft(defaultEventDraft(new Date(Date.now() + 24 * 60 * 60 * 1000)));
    setShowEventForm(false);
    setEventFormStatus('Event saved with calendar color, agenda details, and reminder choices.');
  };

  const scheduleAlerts = async (itemId: string) => {
    const item = schedule.find(candidate => candidate.id === itemId);
    if (!item) return;
    const ids = await scheduleLocalAlerts(item);
    setAlertStatus(prev => ({
      ...prev,
      [itemId]: ids.length ? `${ids.length} alert${ids.length === 1 ? '' : 's'} scheduled on this device` : 'No future alerts to schedule'
    }));
  };

  const removeEvent = (itemId: string, title: string) => {
    removeScheduleItem(itemId);
    setAlertStatus(prev => {
      const next = { ...prev };
      delete next[itemId];
      return next;
    });
    setEventFormStatus(`Removed ${title}.`);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Schedule</Text>
      <Text style={styles.subtitle}>Child-centered calendar for custody, school, medical, meds, events, bring-list prep, and practical reminders.</Text>
      <Text style={styles.helper}>Tap any calendar day to add an event</Text>

      <Card>
        <Text style={styles.monthTitle}>{monthTitle(calendarMonth)}</Text>
        <View style={styles.legendRow}>
          {(Object.keys(typeMeta) as ScheduleType[]).map(type => (
            <View key={type} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: typeMeta[type].color }]} />
              <Text style={styles.legendLabel}>{typeMeta[type].label}</Text>
            </View>
          ))}
        </View>
        <View style={styles.weekdayRow}>{weekdayLabels.map(label => <Text key={label} style={styles.weekdayLabel}>{label}</Text>)}</View>
        <View style={styles.monthGrid}>
          {monthDays.map((day, index) => {
            const key = day ? dateKey(day) : `blank-${index}`;
            const dayEvents = day ? eventsByDate[dateKey(day)] ?? [] : [];
            const isToday = day ? dateKey(day) === dateKey(new Date()) : false;
            if (!day) return <View key={key} style={[styles.dayCell, styles.blankDayCell]} />;
            return (
              <Pressable key={key} onPress={() => openEventForm(day)} style={[styles.dayCell, styles.clickableDayCell, isToday && styles.todayCell]}>
                <Text style={[styles.dayNumber, isToday && styles.todayText]}>{day.getDate()}</Text>
                {dayEvents.slice(0, 3).map(item => {
                  const meta = typeMeta[item.type];
                  return (
                    <Text key={item.id} style={[styles.dayEventLabel, { backgroundColor: meta.soft, color: meta.text, borderLeftColor: meta.color }]}>{shortEventTitle(item.title)}</Text>
                  );
                })}
                {dayEvents.length > 3 ? <Text style={styles.moreEvents}>+{dayEvents.length - 3} more</Text> : null}
                <Text style={[styles.tapToAdd, dayEvents.length > 0 && styles.editOrAddLabel]}>{dayEvents.length > 0 ? '+ event' : '+ event'}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <Text style={styles.name}>Next up</Text>
        {upcomingSchedule.length ? upcomingSchedule.map(item => {
          const meta = typeMeta[item.type];
          return (
            <View key={item.id} style={[styles.agendaItem, { borderLeftColor: meta.color }]}>
              <View style={styles.row}>
                <Text style={[styles.typePill, { backgroundColor: meta.soft, color: meta.text }]}>{meta.label}</Text>
                <Text style={styles.sourcePill}>{sourceLabel(item)}</Text>
              </View>
              <Text style={styles.itemTitle}>{item.title}</Text>
              <Text style={styles.meta}>{new Date(item.startsAt).toLocaleString()} - {childName(item.childId)}</Text>
              {item.location ? <Text style={styles.meta}>Where: {item.location}</Text> : null}
              {item.custodyHolder ? <Text style={styles.meta}>Who has them: {item.custodyHolder}</Text> : null}
              {item.bringList?.length ? <Text style={styles.bringList}>Bring: {item.bringList.join(', ')}</Text> : null}
            </View>
          );
        }) : <Text style={styles.empty}>No upcoming events yet. Add a custody pickup, school item, or appointment from the month view.</Text>}
      </Card>

      <Card>
        <Text style={styles.name}>Nanny-style notification rules</Text>
        <Text>- Night before: pack and prep</Text>
        <Text>- Morning of: get ready and check route</Text>
        <Text>- One hour before: leave / pickup / medication warning</Text>
        <Text>- Journal prompt after important events</Text>
        <Text style={styles.status}>Standing reminder previews: {previewNannyStandingReminders().map(r => `${r.title} ${new Date(r.firesAt).toLocaleString()}`).join(' | ')}</Text>
      </Card>

      <AppModal
        visible={showEventForm}
        eyebrow="New reminder"
        title="Add something to the family calendar"
        description="Pick the type, fill the basics, then add only the extra details that help you leave prepared. Nothing complicated unless you need it."
        onClose={() => {
          setShowEventForm(false);
          setEventDraft(defaultEventDraft(new Date(Date.now() + 24 * 60 * 60 * 1000)));
        }}
        footer={(
          <>
            <PrimaryButton onPress={saveEventDraft}>Save event</PrimaryButton>
            <PrimaryButton tone="quiet" onPress={() => { setShowEventForm(false); setEventDraft(defaultEventDraft(new Date(Date.now() + 24 * 60 * 60 * 1000))); }}>Cancel</PrimaryButton>
            {eventFormStatus ? <Text style={styles.status}>{eventFormStatus}</Text> : null}
          </>
        )}
      >
        <View style={styles.modalSection}>
          <Text style={styles.sectionEyebrow}>1. Start with the type</Text>
          <View style={styles.quickTypeGrid}>
            {quickEventTypes.map(option => {
              const active = eventDraft.type === option.type;
              const meta = typeMeta[option.type];
              return (
                <Pressable
                  key={option.label}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  onPress={() => chooseQuickEventType(option)}
                  style={({ pressed }) => [styles.quickTypeCard, { opacity: pressed ? 0.86 : 1 }, active && { backgroundColor: meta.soft, borderColor: meta.color }]}
                >
                  <View style={[styles.legendDot, { backgroundColor: meta.color }]} />
                  <Text style={[styles.quickTypeText, active && { color: meta.text }]}>{option.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.modalSection}>
          <Text style={styles.sectionEyebrow}>2. The basics</Text>
          <FormField
            label="Event name"
            helper="Use the plain thing you need to remember: pickup, therapy, dentist, meds, school break."
            value={eventDraft.title}
            onChangeText={value => setEventField('title', value)}
            placeholder="Custody exchange"
            returnKeyType="next"
          />

          <Text style={styles.label}>Who is this for?</Text>
          <View style={styles.typePicker}>
            <ChoiceChip selected={!eventDraft.childId} onPress={() => setEventField('childId', '')}>All children</ChoiceChip>
            {children.map(child => (
              <ChoiceChip key={child.id} selected={eventDraft.childId === child.id} onPress={() => setEventField('childId', child.id)}>{child.displayName}</ChoiceChip>
            ))}
          </View>

          <View style={styles.formRow}>
            <FormField
              label="Date"
              helper="MM/DD/YY"
              value={eventDraft.date}
              onChangeText={value => setEventField('date', value)}
              placeholder="5/28/26"
              keyboardType="numbers-and-punctuation"
              containerStyle={styles.formHalf}
            />
            <FormField
              label="Start"
              helper="Simple is fine"
              value={eventDraft.startTime}
              onChangeText={value => setEventField('startTime', value)}
              placeholder="5pm"
              containerStyle={styles.formHalf}
            />
          </View>
        </View>

        <View style={styles.modalSection}>
          <Text style={styles.sectionEyebrow}>3. Helpful details</Text>
          <FormField label="End time" optional value={eventDraft.endTime} onChangeText={value => setEventField('endTime', value)} placeholder="6pm" />
          <FormField label="Location" optional helper="Pickup spot, office, school, or address." value={eventDraft.location} onChangeText={value => setEventField('location', value)} placeholder="School front office" />
          <FormField label="Who has them?" optional helper="Useful for custody/exchange context." value={eventDraft.custodyHolder} onChangeText={value => setEventField('custodyHolder', value)} placeholder="Dad, Mom, caregiver, school" />
          <FormField label="Bring list" optional helper="Comma-separated is fastest." value={eventDraft.bringList} onChangeText={value => setEventField('bringList', value)} placeholder="Backpack, meds, uniform, paperwork" />
          <FormField label="Notes" optional helper="Keep it factual: source, confirmation, dose, pickup detail, or what to check." value={eventDraft.notes} onChangeText={value => setEventField('notes', value)} placeholder="Confirmed by text. Bring insurance card." multiline />
        </View>

        <View style={styles.modalSection}>
          <Text style={styles.sectionEyebrow}>4. Reminders</Text>
          <Text style={styles.help}>Default reminders are already selected because leaving prepared is the point. Turn off anything you do not need.</Text>
          <View style={styles.reminderGrid}>
            <ChoiceChip selected={eventDraft.dayBefore} onPress={() => toggleReminder('dayBefore')}>Night before</ChoiceChip>
            <ChoiceChip selected={eventDraft.dayOf} onPress={() => toggleReminder('dayOf')}>Morning of</ChoiceChip>
            <ChoiceChip selected={eventDraft.hourBefore} onPress={() => toggleReminder('hourBefore')}>1 hour before</ChoiceChip>
          </View>
          {eventDraft.customReminders.map(reminder => (
            <View key={reminder.id} style={styles.customReminderRow}>
              <View style={styles.customReminderInput}>
                <FormField
                  label="Custom reminder"
                  value={reminder.minutesBefore}
                  onChangeText={value => updateCustomReminder(reminder.id, value)}
                  placeholder="30"
                  keyboardType="number-pad"
                />
              </View>
              <PrimaryButton tone="quiet" onPress={() => removeCustomReminder(reminder.id)}>Remove</PrimaryButton>
            </View>
          ))}
          <PrimaryButton tone="quiet" onPress={addCustomReminder}>+ Add custom reminder</PrimaryButton>
          <Text style={styles.reminderPreview}>Selected: {buildNotificationOffsets().map(reminderLabel).join(', ') || 'No reminders selected'}</Text>
        </View>
      </AppModal>      {!showEventForm && eventFormStatus ? <Text style={styles.status}>{eventFormStatus}</Text> : null}

      {sortedSchedule.length === 0 && showOnboarding ? (
        <Card>
          <View style={styles.nannyRow}>
            <View style={styles.nannyAvatar}><Text style={styles.nannyFace}>NS</Text></View>
            <View style={styles.nannyBubble}>
              <Text style={styles.nannyName}>Nanny Nova</Text>
              <Text style={styles.nannyEyebrow}>Getting started</Text>
              <Text style={styles.nannyTitle}>Build the calendar around the child</Text>
              <Text style={styles.nannyBody}>{onboardingTips[onboardingStep]}</Text>
            </View>
          </View>
          <View style={styles.progressDots}>{onboardingTips.map((_, index) => <View key={index} style={[styles.dot, index === onboardingStep && styles.activeDot]} />)}</View>
          <PrimaryButton tone="quiet" onPress={() => setShowOnboarding(false)}>Hide guide</PrimaryButton>
        </Card>
      ) : null}

      {sortedSchedule.map(item => {
        const meta = typeMeta[item.type];
        return (
          <Card key={item.id}>
            <View style={styles.row}>
              <Text style={[styles.typePill, { backgroundColor: meta.soft, color: meta.text }]}>{meta.label}</Text>
              <Text style={styles.sourcePill}>{sourceLabel(item)}</Text>
            </View>
            <Text style={styles.itemTitle}>{item.title}</Text>
            {showOnboarding && item.type === 'event' && onboardingStep < onboardingTips.length ? <Text style={styles.tip}>{onboardingTips[onboardingStep]}</Text> : null}
            <Text style={styles.meta}>{childName(item.childId)}</Text>
            <Text>{new Date(item.startsAt).toLocaleString()}</Text>
            {item.location ? <Text>Where: {item.location}</Text> : null}
            {item.custodyHolder ? <Text>Who has them: {item.custodyHolder}</Text> : null}
            {item.bringList?.length ? <Text style={styles.bringList}>Bring: {item.bringList.join(', ')}</Text> : null}
            {item.notes ? <Text style={styles.notes}>{item.notes}</Text> : null}
            <Text style={styles.alerts}>Reminders: {item.notificationOffsets.map(formatOffset).join(', ') || 'none'}</Text>
            <Text style={styles.alerts}>Planned Nanny-style alerts: {previewNannyStyleAlerts(item).map(reminder => `${reminder.kind} ${new Date(reminder.firesAt).toLocaleString()}`).join(' | ') || 'none in future'}</Text>
            {item.type === 'medication' ? (item.takenAt ? <Text style={styles.taken}>Taken at {new Date(item.takenAt).toLocaleTimeString()}</Text> : <PrimaryButton onPress={() => markMedicationTaken(item.id)}>Mark as taken</PrimaryButton>) : null}
            <View style={styles.eventActionRow}>
              <View style={styles.eventActionButton}><PrimaryButton tone="quiet" onPress={() => scheduleAlerts(item.id)}>Schedule local alerts</PrimaryButton></View>
              <View style={styles.eventActionButton}><PrimaryButton tone="danger" onPress={() => removeEvent(item.id, item.title)}>Remove event</PrimaryButton></View>
            </View>
            {alertStatus[item.id] ? <Text style={styles.status}>{alertStatus[item.id]}</Text> : null}
          </Card>
        );
      })}

      <View style={styles.onboardingButtons}>
        {showOnboarding ? (
          <>
            <PrimaryButton tone="quiet" onPress={() => setShowOnboarding(false)}>Hide guide</PrimaryButton>
            <PrimaryButton disabled={onboardingStep === onboardingTips.length - 1} onPress={() => setOnboardingStep(step => Math.min(step + 1, onboardingTips.length - 1))}>Next tip</PrimaryButton>
          </>
        ) : null}
      </View>

      <View style={styles.bottomEventCta}>
        <Text style={styles.bottomEventTitle}>Need to add something?</Text>
        <Text style={styles.bottomEventHelp}>Tap here anytime to create an event, reminder, appointment, school item, or custody note.</Text>
        <PrimaryButton onPress={() => openEventForm()}>+ Add Event</PrimaryButton>
      </View>
    </ScrollView>
  );
}

const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { padding: 18, paddingBottom: 34, backgroundColor: theme.app },
  title: { fontSize: 36, fontWeight: '900', color: theme.text, letterSpacing: -0.8, marginTop: 4 },
  subtitle: { color: theme.text, marginTop: 6, marginBottom: 18, lineHeight: 24, fontSize: 16, fontWeight: '700' },
  helper: { color: theme.mode === 'light' ? '#ffffff' : theme.primary, fontWeight: '900', marginBottom: 24, textAlign: 'center', backgroundColor: theme.mode === 'light' ? theme.primaryStrong : theme.primarySoft, borderRadius: 999, paddingVertical: 10, paddingHorizontal: 12, overflow: 'hidden' },
  help: { color: theme.text, marginTop: 6, marginBottom: 10, lineHeight: 22, fontSize: 16, fontWeight: '600' },
  modalSection: { marginTop: 4, marginBottom: 12, padding: 12, borderRadius: 20, backgroundColor: theme.mode === 'light' ? '#f8fafc' : theme.surface, borderWidth: 1, borderColor: theme.border },
  sectionEyebrow: { color: theme.primary, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.7, fontSize: 12, marginBottom: 2 },
  label: { color: theme.text, fontWeight: '900', fontSize: 16, marginTop: 12, marginBottom: 4 },
  empty: { color: theme.muted },
  input: { minHeight: 50, borderRadius: 16, borderWidth: 2, borderColor: theme.inputBorder, padding: 12, backgroundColor: theme.input, marginTop: 8, color: theme.text, fontSize: 16, fontWeight: '700' },
  textArea: { minHeight: 104, borderRadius: 16, borderWidth: 2, borderColor: theme.inputBorder, padding: 12, backgroundColor: theme.input, marginTop: 8, color: theme.text, fontSize: 16, fontWeight: '700', textAlignVertical: 'top' },
  formRow: { flexDirection: 'row', gap: 8 },
  formHalf: { flex: 1 },
  typePicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  quickTypeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  quickTypeCard: { minWidth: '30%', flexGrow: 1, borderWidth: 2, borderColor: theme.border, backgroundColor: theme.surface, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 14, alignItems: 'center', gap: 6 },
  quickTypeText: { color: theme.text, fontWeight: '900' },
  typeChip: { borderWidth: 2, borderColor: theme.border, backgroundColor: theme.input, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 9 },
  typeChipActive: { backgroundColor: theme.primarySoft, borderColor: theme.primary },
  typeChipText: { color: theme.text, fontWeight: '800' },
  typeChipTextActive: { color: theme.primary },
  reminderGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  reminderCard: { flexGrow: 1, minWidth: '30%', borderWidth: 2, borderColor: theme.border, backgroundColor: theme.input, borderRadius: 18, paddingHorizontal: 10, paddingVertical: 14, alignItems: 'center' },
  reminderCardActive: { backgroundColor: theme.primarySoft, borderColor: theme.primary },
  reminderCardText: { color: theme.text, fontWeight: '900', textAlign: 'center' },
  reminderCardTextActive: { color: theme.primary },
  customReminderRow: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  customReminderInput: { flex: 1 },
  reminderPreview: { color: theme.primary, fontWeight: '800', marginTop: 10 },
  monthTitle: { color: theme.text, fontSize: 24, fontWeight: '900', marginBottom: 12, textAlign: 'center' },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginBottom: 12 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: theme.input, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 5 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendLabel: { color: theme.muted, fontSize: 11, fontWeight: '800' },
  weekdayRow: { flexDirection: 'row', marginBottom: 6 },
  weekdayLabel: { flex: 1, color: theme.muted, fontSize: 12, fontWeight: '900', textAlign: 'center' },
  monthGrid: { flexDirection: 'row', flexWrap: 'wrap', borderTopWidth: 2, borderLeftWidth: 2, borderColor: theme.border, borderRadius: 18, overflow: 'hidden' },
  dayCell: { width: '14.2857%', minHeight: 88, borderRightWidth: 2, borderBottomWidth: 2, borderColor: theme.border, padding: 5, backgroundColor: theme.surface },
  clickableDayCell: { backgroundColor: theme.mode === 'light' ? '#ffffff' : theme.input },
  blankDayCell: { backgroundColor: theme.elevated, opacity: 0.45 },
  todayCell: { backgroundColor: theme.primarySoft },
  dayNumber: { color: theme.text, fontSize: 14, fontWeight: '900', marginBottom: 3 },
  todayText: { color: theme.primary },
  dayEventLabel: { borderLeftWidth: 3, borderRadius: 7, paddingHorizontal: 4, paddingVertical: 3, fontSize: 11, fontWeight: '900', marginTop: 2, overflow: 'hidden' },
  moreEvents: { color: theme.muted, fontSize: 11, fontWeight: '800', marginTop: 2 },
  tapToAdd: { color: theme.muted, fontSize: 11, fontWeight: '900', marginTop: 8 },
  editOrAddLabel: { color: theme.primary, backgroundColor: theme.primarySoft, borderRadius: 6, paddingHorizontal: 4, paddingVertical: 2 },
  agendaItem: { borderLeftWidth: 5, borderRadius: 16, backgroundColor: theme.mode === 'light' ? '#fffbf5' : theme.input, padding: 12, marginTop: 10 },
  typePill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, fontSize: 12, fontWeight: '900', overflow: 'hidden' },
  sourcePill: { color: theme.text, fontSize: 12, fontWeight: '900' },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', justifyContent: 'center', padding: 16 },
  eventPopup: { maxHeight: '92%', borderRadius: 28, backgroundColor: theme.card, borderWidth: 1, borderColor: theme.border, overflow: 'hidden', shadowColor: theme.shadow, shadowOpacity: theme.mode === 'light' ? 0.12 : 0.3, shadowRadius: 24, shadowOffset: { width: 0, height: 12 }, elevation: 8 },
  eventPopupContent: { padding: 18, paddingBottom: 24 },
  popupEyebrow: { color: theme.primary, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 12 },
  popupTitle: { color: theme.text, fontSize: 24, fontWeight: '900', marginTop: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  name: { fontSize: 19, fontWeight: '800', marginTop: 4, color: theme.text },
  meta: { color: theme.muted, marginTop: 3, fontWeight: '700' },
  bringList: { color: theme.primary, fontWeight: '800', marginTop: 6 },
  notes: { color: theme.text, marginTop: 8, fontWeight: '600' },
  alerts: { color: theme.text, marginTop: 8, fontWeight: '600' },
  taken: { color: '#15803d', fontWeight: '800', marginTop: 8 },
  status: { color: theme.primary, fontWeight: '700', marginTop: 8 },
  nannyRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  nannyAvatar: { width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#e0f2fe', borderWidth: 2, borderColor: '#38bdf8' },
  nannyFace: { fontSize: 36 },
  nannyBubble: { flex: 1, backgroundColor: theme.primarySoft, borderRadius: 18, padding: 12, borderWidth: 2, borderColor: theme.mode === 'light' ? theme.primary : theme.border },
  nannyName: { color: theme.primary, fontWeight: '900', marginBottom: 2 },
  nannyEyebrow: { color: theme.text, fontWeight: '900', fontSize: 12, textTransform: 'uppercase' },
  nannyTitle: { color: theme.text, fontWeight: '900', fontSize: 17, marginTop: 4 },
  nannyBody: { color: theme.text, marginTop: 6, lineHeight: 20, fontWeight: '600' },
  progressDots: { flexDirection: 'row', gap: 6, marginTop: 12, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#cbd5e1' },
  activeDot: { backgroundColor: theme.primary, width: 18 },
  itemTitle: { color: theme.text, fontWeight: '900', fontSize: 17, marginTop: 6 },
  onboardingButtons: { marginTop: 12, gap: 8 },
  eventActionRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 4 },
  eventActionButton: { flex: 1 },
  bottomEventCta: { marginTop: 18, padding: 18, borderRadius: 26, backgroundColor: theme.mode === 'light' ? '#ffffff' : theme.primarySoft, borderWidth: 2, borderColor: theme.primary, gap: 8, shadowColor: theme.shadow, shadowOpacity: theme.mode === 'light' ? 0.14 : 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  bottomEventTitle: { color: theme.text, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  bottomEventHelp: { color: theme.muted, textAlign: 'center', lineHeight: 20, fontSize: 15 },
  tip: { color: theme.primary, fontWeight: '700', fontSize: 13, marginTop: 6 }
});
