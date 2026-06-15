/**
 * PARENTVAULT-COMMENTARY
 *
 * Child vault screen for identity, care, medical, provider, emergency, insurance, school, and custody details.
 *
 * This page is where scattered critical information becomes structured and searchable.
 *
 * Any production persistence from this screen must encrypt sensitive fields and mask high-risk values by default.
 *
 * Reading guide:
 * - Comments in this project explain product intent, privacy/security boundaries, and why a flow exists.
 * - They are deliberately more detailed than normal production comments because this app is being shared for learning, review, and handoff.
 * - If code and comments ever disagree, fix both together; stale privacy/security comments are dangerous.
 */

import { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { findChildVaultGaps, type ChildProfile, type SchoolCalendarDate, type SchoolDateType, type SchoolEnrichmentSuggestion, type SchoolInfo } from '@parentvault/shared';
import { Card } from '../components/Card';
import { PrimaryButton } from '../components/PrimaryButton';
import { schoolDatesToScheduleItems, suggestSchoolEnrichment } from '../services/schoolEnrichment';
import { useVaultStore } from '../store/vaultStore';
import { useTheme } from '../theme';

const formatAddress = (address?: { line1: string; line2?: string; city: string; state: string; postalCode: string }) => {
  if (!address) return 'Location not set';
  return [address.line1, address.line2, `${address.city}, ${address.state} ${address.postalCode}`].filter(Boolean).join(', ');
};

const mergeSchool = (current: SchoolInfo | undefined, suggestion: SchoolEnrichmentSuggestion): SchoolInfo => ({
  id: current?.id ?? `school-${Date.now()}`,
  schoolName: suggestion.school.schoolName ?? current?.schoolName ?? 'School',
  districtName: suggestion.school.districtName ?? current?.districtName,
  grade: current?.grade,
  teacherName: current?.teacherName,
  mainPhone: suggestion.school.mainPhone ?? current?.mainPhone,
  attendancePhone: suggestion.school.attendancePhone ?? current?.attendancePhone,
  websiteUrl: suggestion.school.websiteUrl ?? current?.websiteUrl,
  calendarUrl: suggestion.school.calendarUrl ?? current?.calendarUrl,
  address: suggestion.school.address ?? current?.address,
  officeHours: suggestion.school.officeHours ?? current?.officeHours,
  schoolHours: suggestion.school.schoolHours ?? current?.schoolHours,
  pickupInstructions: current?.pickupInstructions,
  busInfo: current?.busInfo,
  calendarDates: [...(current?.calendarDates ?? []), ...suggestion.calendarDates],
  lastEnrichedAt: new Date().toISOString(),
  enrichmentSources: suggestion.sources,
  notes: [current?.notes, suggestion.school.notes].filter(Boolean).join('\n') || undefined
});

const onboardingSteps = [
  {
    eyebrow: 'Step 1',
    title: "Let's make the child profile useful first.",
    body: "Start with the child's name, birthday, allergies, important medical notes, and trusted pickup contacts."
  },
  {
    eyebrow: 'Step 2',
    title: "Next, I'll help collect school details.",
    body: 'School, teacher, hours, pickup rules, attendance phone, calendar, and no-school dates all belong here.'
  },
  {
    eyebrow: 'Step 3',
    title: 'Then we add care logistics.',
    body: 'Doctors, pharmacy, medication schedules, insurance, refill notes, and emergency instructions.'
  },
  {
    eyebrow: 'Step 4',
    title: 'Finally, custody and journal notes.',
    body: 'Keep exchanges, reminders, court-order snippets, incidents, and evidence-style journal notes reviewable before saving.'
  }
];

type ChildEditDraft = {
  displayName: string;
  legalName: string;
  preferredName: string;
  birthdate: string;
  ssnLast4: string;
  ssnFull: string;
  doctors: DoctorDraft[];
  allergies: string;
  conditions: string;
  dietaryRestrictions: string;
  careInstructions: string;
};

type DoctorDraft = {
  id: string;
  doctorName: string;
  doctorOffice: string;
  doctorLocation: string;
  doctorPhone: string;
  doctorRole: string;
};

const doctorProviderTypes = ['pediatrician', 'doctor', 'dentist', 'specialist', 'therapist'] as const;

const emptyDoctorDraft = (): DoctorDraft => ({
  id: `doctor-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  doctorName: '',
  doctorOffice: '',
  doctorLocation: '',
  doctorPhone: '',
  doctorRole: 'Doctor'
});

type SchoolCalendarDraft = {
  location: string;
  phoneNumber: string;
  principalName: string;
  teacherName: string;
  teacherPhone: string;
  teacherEmail: string;
  officeHours: string;
  schoolHours: string;
  springBreakStart: string;
  springBreakEnd: string;
  christmasBreakStart: string;
  christmasBreakEnd: string;
  newYearsBreakStart: string;
  newYearsBreakEnd: string;
  fallBreakStart: string;
  fallBreakEnd: string;
  extraDaysOff: { id: string; title: string; startsAt: string; endsAt: string }[];
};

const emptySchoolCalendarDraft = (): SchoolCalendarDraft => ({
  location: '',
  phoneNumber: '',
  principalName: '',
  teacherName: '',
  teacherPhone: '',
  teacherEmail: '',
  officeHours: '',
  schoolHours: '',
  springBreakStart: '',
  springBreakEnd: '',
  christmasBreakStart: '',
  christmasBreakEnd: '',
  newYearsBreakStart: '',
  newYearsBreakEnd: '',
  fallBreakStart: '',
  fallBreakEnd: '',
  extraDaysOff: []
});

const emptyChildEditDraft = (): ChildEditDraft => ({
  displayName: '',
  legalName: '',
  preferredName: '',
  birthdate: '',
  ssnLast4: '',
  ssnFull: '',
  doctors: [emptyDoctorDraft()],
  allergies: '',
  conditions: '',
  dietaryRestrictions: '',
  careInstructions: ''
});

const listToDraftText = (items: string[]) => items.join(', ');

const draftTextToList = (value: string) => value.split(',').map(item => item.trim()).filter(Boolean);

const dateTimeFromDraft = (value: string, fallbackHour: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.includes('T') ? trimmed : `${trimmed}T${fallbackHour}:00`;
};

const makeCalendarDate = (title: string, startsAt: string, endsAt?: string, type: SchoolDateType = 'no_school'): SchoolCalendarDate | null => {
  const start = dateTimeFromDraft(startsAt, '00:00');
  if (!start) return null;
  return {
    id: `school-date-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    type,
    title,
    startsAt: start,
    endsAt: dateTimeFromDraft(endsAt ?? '', '23:59') || undefined,
    noSchool: true,
    confidence: 1,
    notes: 'Parent-entered school calendar date.'
  };
};

const buildSchoolCalendarDates = (draft: SchoolCalendarDraft): SchoolCalendarDate[] => [
  makeCalendarDate('Spring break', draft.springBreakStart, draft.springBreakEnd, 'break'),
  makeCalendarDate('Christmas break', draft.christmasBreakStart, draft.christmasBreakEnd, 'break'),
  makeCalendarDate('New Year’s break', draft.newYearsBreakStart, draft.newYearsBreakEnd, 'break'),
  makeCalendarDate('Fall break', draft.fallBreakStart, draft.fallBreakEnd, 'break'),
  ...draft.extraDaysOff.map(day => makeCalendarDate(day.title.trim() || 'School day off', day.startsAt, day.endsAt))
].filter((date): date is SchoolCalendarDate => Boolean(date));

const childToEditDraft = (child: ChildProfile): ChildEditDraft => ({
  displayName: child.displayName,
  legalName: child.legalName ?? '',
  preferredName: child.preferredName ?? '',
  birthdate: child.birthdate ?? '',
  ssnLast4: child.ssnLast4 ?? '',
  ssnFull: child.customInfo?.find(item => item.title === 'SSN' || item.title === 'Full SSN')?.value ?? '',
  doctors: child.careProviders.filter(provider => doctorProviderTypes.includes(provider.type as typeof doctorProviderTypes[number]) || provider.role?.toLowerCase().includes('doctor')).map(provider => ({
    id: provider.id,
    doctorName: provider.personName ?? '',
    doctorOffice: provider.organizationName ?? '',
    doctorLocation: provider.address?.line1 ?? provider.notes?.replace(/^Location: /, '') ?? '',
    doctorPhone: provider.phone ?? '',
    doctorRole: provider.role ?? (provider.type === 'dentist' ? 'Dentist' : provider.type === 'therapist' ? 'Therapist' : provider.type === 'specialist' ? 'Specialist' : 'Doctor')
  })).concat(child.careProviders.some(provider => doctorProviderTypes.includes(provider.type as typeof doctorProviderTypes[number]) || provider.role?.toLowerCase().includes('doctor')) ? [] : [emptyDoctorDraft()]),
  allergies: listToDraftText(child.medical.allergies),
  conditions: listToDraftText(child.medical.conditions),
  dietaryRestrictions: listToDraftText(child.medical.dietaryRestrictions),
  careInstructions: child.medical.careInstructions ?? ''
});

export function ProfilesScreen() {
  // Theme and styles stay at the top so the visual rules are easy to find.
  const theme = useTheme();
  const styles = createStyles(theme);

  // Store values are the saved vault data this tab displays or updates.
  const children = useVaultStore(s => s.children);
  const addChild = useVaultStore(s => s.addChild);
  const updateChild = useVaultStore(s => s.updateChild);
  const removeChild = useVaultStore(s => s.removeChild);
  const updateChildSchool = useVaultStore(s => s.updateChildSchool);
  const addScheduleItem = useVaultStore(s => s.addScheduleItem);
  const wipe = useVaultStore(s => s.wipe);

  // Local state only controls this screen's temporary school-search and guide UI.
  const [schoolQuery, setSchoolQuery] = useState('');
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [schoolCalendarDraft, setSchoolCalendarDraft] = useState<SchoolCalendarDraft>(() => emptySchoolCalendarDraft());
  const [suggestion, setSuggestion] = useState<SchoolEnrichmentSuggestion | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(true);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [customInfoDrafts, setCustomInfoDrafts] = useState<Record<string, { title: string; value: string }>>({});
  const [activeCustomInfoChildIds, setActiveCustomInfoChildIds] = useState<Record<string, boolean>>({});
  const [childEditDrafts, setChildEditDrafts] = useState<Record<string, ChildEditDraft>>({});
  const [activeEditChildIds, setActiveEditChildIds] = useState<Record<string, boolean>>({});
  const customTitleInputRefs = useRef<Record<string, TextInput | null>>({});
  const customValueInputRefs = useRef<Record<string, TextInput | null>>({});

  const firstChild = children[0];
  const nannyStep = onboardingSteps[onboardingStep];

  const setSchoolCalendarField = (key: keyof Omit<SchoolCalendarDraft, 'extraDaysOff'>, value: string) => {
    setSchoolCalendarDraft(current => ({ ...current, [key]: value }));
  };

  const addExtraDayOffDraft = () => {
    setSchoolCalendarDraft(current => ({
      ...current,
      extraDaysOff: [...current.extraDaysOff, { id: `day-off-${Date.now()}`, title: '', startsAt: '', endsAt: '' }]
    }));
  };

  const updateExtraDayOffDraft = (dayId: string, key: 'title' | 'startsAt' | 'endsAt', value: string) => {
    setSchoolCalendarDraft(current => ({
      ...current,
      extraDaysOff: current.extraDaysOff.map(day => day.id === dayId ? { ...day, [key]: value } : day)
    }));
  };

  const removeExtraDayOffDraft = (dayId: string) => {
    setSchoolCalendarDraft(current => ({
      ...current,
      extraDaysOff: current.extraDaysOff.filter(day => day.id !== dayId)
    }));
  };

  // Draft school details from public/known school info, but do not save anything yet.
  const enrichSchool = async () => {
    const schoolName = schoolQuery.trim() || firstChild?.school?.schoolName;
    if (!schoolName) return;
    const draftSuggestion = await suggestSchoolEnrichment({ schoolName, city: city.trim() || firstChild?.school?.address?.city, state: stateCode.trim() || firstChild?.school?.address?.state, academicYear: 'current school year' });
    const manualDates = buildSchoolCalendarDates(schoolCalendarDraft);
    setSuggestion({
      ...draftSuggestion,
      school: {
        ...draftSuggestion.school,
        address: schoolCalendarDraft.location.trim() ? {
          line1: schoolCalendarDraft.location.trim(),
          city: city.trim() || draftSuggestion.school.address?.city || '',
          state: stateCode.trim() || draftSuggestion.school.address?.state || '',
          postalCode: draftSuggestion.school.address?.postalCode || ''
        } : draftSuggestion.school.address,
        mainPhone: schoolCalendarDraft.phoneNumber.trim() || draftSuggestion.school.mainPhone,
        teacherName: schoolCalendarDraft.teacherName.trim() || draftSuggestion.school.teacherName,
        officeHours: schoolCalendarDraft.officeHours.trim() || draftSuggestion.school.officeHours,
        schoolHours: schoolCalendarDraft.schoolHours.trim() || draftSuggestion.school.schoolHours,
        notes: [
          draftSuggestion.school.notes,
          schoolCalendarDraft.principalName.trim() ? `Principal: ${schoolCalendarDraft.principalName.trim()}` : undefined,
          schoolCalendarDraft.teacherPhone.trim() ? `Teacher phone: ${schoolCalendarDraft.teacherPhone.trim()}` : undefined,
          schoolCalendarDraft.teacherEmail.trim() ? `Teacher email: ${schoolCalendarDraft.teacherEmail.trim()}` : undefined
        ].filter(Boolean).join('\n') || undefined
      },
      calendarDates: [...draftSuggestion.calendarDates, ...manualDates],
      sources: manualDates.length ? [...draftSuggestion.sources, 'Parent-entered school calendar dates'] : draftSuggestion.sources,
      warnings: manualDates.length ? draftSuggestion.warnings.filter(warning => !warning.includes('Add official calendar dates manually')) : draftSuggestion.warnings
    });
  };

  // Save the reviewed school suggestion and convert school calendar dates into schedule items.
  const confirmSchoolSuggestion = () => {
    if (!suggestion || !firstChild) return;
    updateChildSchool(firstChild.id, mergeSchool(firstChild.school, suggestion));
    schoolDatesToScheduleItems(firstChild.id, suggestion.calendarDates).forEach(addScheduleItem);
    setSuggestion(null);
  };

  const setCustomInfoDraft = (childId: string, key: 'title' | 'value', value: string) => {
    setCustomInfoDrafts(current => ({
      ...current,
      [childId]: { title: current[childId]?.title ?? '', value: current[childId]?.value ?? '', [key]: value }
    }));
  };

  const startCustomInfoDraft = (childId: string) => {
    setActiveCustomInfoChildIds(current => ({ ...current, [childId]: true }));
    setCustomInfoDrafts(current => ({
      ...current,
      [childId]: current[childId] ?? { title: '', value: '' }
    }));
    setTimeout(() => customTitleInputRefs.current[childId]?.focus(), 0);
  };

  const focusCustomInfoValue = (childId: string) => {
    setTimeout(() => customValueInputRefs.current[childId]?.focus(), 0);
  };

  const addCustomInfo = (childId: string) => {
    const child = children.find(item => item.id === childId);
    const draft = customInfoDrafts[childId];
    const title = draft?.title.trim() ?? '';
    const value = draft?.value.trim() ?? '';
    if (!child || (!title && !value)) return;
    const savedAt = new Date().toISOString();
    updateChild(childId, {
      customInfo: [...(child.customInfo ?? []), {
        id: `custom-${Date.now()}`,
        title: title || 'Other information',
        value: value || 'Not filled in yet',
        createdAt: savedAt,
        updatedAt: savedAt
      }]
    });
    setCustomInfoDrafts(current => ({ ...current, [childId]: { title: '', value: '' } }));
    setActiveCustomInfoChildIds(current => ({ ...current, [childId]: false }));
  };

  const removeCustomInfo = (childId: string, customInfoId: string) => {
    const child = children.find(item => item.id === childId);
    if (!child) return;
    updateChild(childId, { customInfo: (child.customInfo ?? []).filter(item => item.id !== customInfoId) });
  };

  const startChildEdit = (child: ChildProfile) => {
    setChildEditDrafts(current => ({ ...current, [child.id]: current[child.id] ?? childToEditDraft(child) }));
    setActiveEditChildIds(current => ({ ...current, [child.id]: true }));
  };

  const addChildAndOpenForm = () => {
    const childId = addChild({
      displayName: 'New Child',
      medical: { allergies: [], conditions: [], medications: [], dietaryRestrictions: [], sensoryNeeds: [] },
      careProviders: [],
      contacts: [],
      insurance: [],
      customInfo: []
    });
    setChildEditDrafts(current => ({ ...current, [childId]: emptyChildEditDraft() }));
    setActiveEditChildIds(current => ({ ...current, [childId]: true }));
  };

  const setChildEditDraft = (childId: string, key: keyof ChildEditDraft, value: string) => {
    const child = children.find(item => item.id === childId);
    if (!child) return;
    setChildEditDrafts(current => ({
      ...current,
      [childId]: { ...(current[childId] ?? childToEditDraft(child)), [key]: value }
    }));
  };

  const setDoctorDraft = (childId: string, doctorId: string, key: keyof Omit<DoctorDraft, 'id'>, value: string) => {
    const child = children.find(item => item.id === childId);
    if (!child) return;
    setChildEditDrafts(current => {
      const draft = current[childId] ?? childToEditDraft(child);
      return {
        ...current,
        [childId]: {
          ...draft,
          doctors: draft.doctors.map(doctor => doctor.id === doctorId ? { ...doctor, [key]: value } : doctor)
        }
      };
    });
  };

  const addDoctorDraft = (childId: string) => {
    const child = children.find(item => item.id === childId);
    if (!child) return;
    setChildEditDrafts(current => {
      const draft = current[childId] ?? childToEditDraft(child);
      return { ...current, [childId]: { ...draft, doctors: [...draft.doctors, emptyDoctorDraft()] } };
    });
  };

  const removeDoctorDraft = (childId: string, doctorId: string) => {
    const child = children.find(item => item.id === childId);
    if (!child) return;
    setChildEditDrafts(current => {
      const draft = current[childId] ?? childToEditDraft(child);
      const remainingDoctors = draft.doctors.filter(doctor => doctor.id !== doctorId);
      return { ...current, [childId]: { ...draft, doctors: remainingDoctors.length ? remainingDoctors : [emptyDoctorDraft()] } };
    });
  };

  const saveChildEdit = (child: ChildProfile) => {
    const draft = childEditDrafts[child.id] ?? childToEditDraft(child);
    const cleanedFullSsn = draft.ssnFull.replace(/[^0-9]/g, '').slice(0, 9);
    const doctorProviders = draft.doctors.map((doctor, index) => {
      const doctorName = doctor.doctorName.trim();
      const doctorOffice = doctor.doctorOffice.trim();
      const doctorLocation = doctor.doctorLocation.trim();
      const doctorPhone = doctor.doctorPhone.trim();
      const doctorRole = doctor.doctorRole.trim() || 'Doctor';
      if (!doctorName && !doctorOffice && !doctorLocation && !doctorPhone && !doctorRole) return null;
      const lowerRole = doctorRole.toLowerCase();
      const providerType = lowerRole.includes('dentist') ? 'dentist' as const : lowerRole.includes('therap') ? 'therapist' as const : lowerRole.includes('special') ? 'specialist' as const : index === 0 ? 'pediatrician' as const : 'doctor' as const;
      return {
        id: doctor.id.startsWith('doctor-') ? `provider-${Date.now()}-${index}` : doctor.id,
        type: providerType,
        personName: doctorName || doctorRole,
        organizationName: doctorOffice || undefined,
        role: doctorRole,
        phone: doctorPhone || undefined,
        address: doctorLocation ? { line1: doctorLocation, city: '', state: '', postalCode: '' } : undefined,
        isPrimary: index === 0,
        updatedAt: new Date().toISOString()
      };
    }).filter((provider): provider is NonNullable<typeof provider> => Boolean(provider));
    const ssnInfo = cleanedFullSsn ? [{
      id: child.customInfo?.find(item => item.title === 'SSN' || item.title === 'Full SSN')?.id ?? `custom-ssn-${Date.now()}`,
      title: 'SSN',
      value: cleanedFullSsn.replace(/^(\d{3})(\d{2})(\d{0,4}).*/, '$1-$2-$3'),
      createdAt: child.customInfo?.find(item => item.title === 'SSN' || item.title === 'Full SSN')?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }] : [];
    updateChild(child.id, {
      displayName: draft.displayName.trim() || 'Unnamed child',
      legalName: draft.legalName.trim() || undefined,
      preferredName: draft.preferredName.trim() || undefined,
      birthdate: draft.birthdate.trim() || undefined,
      ssnLast4: (cleanedFullSsn || draft.ssnLast4.replace(/[^0-9]/g, '')).slice(-4) || undefined,
      customInfo: [
        ...(child.customInfo ?? []).filter(item => item.title !== 'SSN' && item.title !== 'Full SSN' && item.title !== 'Full SSN (demo only)'),
        ...ssnInfo
      ],
      careProviders: [
        ...(child.careProviders ?? []).filter(provider => !(doctorProviderTypes.includes(provider.type as typeof doctorProviderTypes[number]) || provider.role?.toLowerCase().includes('doctor'))),
        ...doctorProviders
      ],
      medical: {
        ...child.medical,
        allergies: draftTextToList(draft.allergies),
        conditions: draftTextToList(draft.conditions),
        dietaryRestrictions: draftTextToList(draft.dietaryRestrictions),
        careInstructions: draft.careInstructions.trim() || undefined
      }
    });
    setActiveEditChildIds(current => ({ ...current, [child.id]: false }));
  };

  const cancelChildEdit = (childId: string) => {
    setActiveEditChildIds(current => ({ ...current, [childId]: false }));
    setChildEditDrafts(current => {
      const next = { ...current };
      delete next[childId];
      return next;
    });
  };

  // Render order: guide, child cards/add-child controls, school draft, reviewed suggestion, and wipe control.
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Child vault</Text>
      <Text style={styles.subtitle}>Detailed identity, medical, doctor, school, insurance, custody, and emergency information.</Text>

      {showOnboarding ? (
        <Card>
          <View style={styles.nannyRow}>
            <View style={styles.nannyAvatar}><Text style={styles.nannyFace}>NB</Text></View>
            <View style={styles.nannyBubble}>
              <Text style={styles.nannyName}>Nanny Nova</Text>
              <Text style={styles.nannyEyebrow}>{nannyStep.eyebrow} of {onboardingSteps.length}</Text>
              <Text style={styles.nannyTitle}>{nannyStep.title}</Text>
              <Text style={styles.nannyBody}>{nannyStep.body}</Text>
            </View>
          </View>
          <View style={styles.progressDots}>
            {onboardingSteps.map((_, index) => <View key={index} style={[styles.dot, index === onboardingStep && styles.activeDot]} />)}
          </View>
          <View style={styles.onboardingButtons}>
            <PrimaryButton tone="quiet" onPress={() => setShowOnboarding(false)}>Hide guide</PrimaryButton>
            <PrimaryButton onPress={() => setOnboardingStep(step => Math.min(step + 1, onboardingSteps.length - 1))} disabled={onboardingStep === onboardingSteps.length - 1}>Next tip</PrimaryButton>
          </View>
        </Card>
      ) : null}

      {children.map(child => (
        <Card key={child.id}>
          {!activeEditChildIds[child.id] ? (
            <>
              <Text style={styles.name}>{child.displayName}</Text>
              {child.legalName ? <Text>Legal name: {child.legalName}</Text> : null}
              {child.preferredName ? <Text>Preferred name: {child.preferredName}</Text> : null}
              <Text>Birthdate: {child.birthdate || 'Not set'}</Text>
              <Text>SSN: {child.ssnLast4 ? `***-**-${child.ssnLast4.replace(/[^0-9]/g, '') || '****'}` : 'Not stored'}</Text>
            </>
          ) : null}

          {activeEditChildIds[child.id] ? (
            <View style={styles.editPanel}>
              <Text style={styles.section}>Edit child information</Text>
              <Text style={styles.help}>Manual mode works here too — no nanny required. Separate allergies, conditions, and dietary restrictions with commas.</Text>
              <TextInput value={childEditDrafts[child.id]?.displayName ?? child.displayName} onChangeText={value => setChildEditDraft(child.id, 'displayName', value)} placeholder="Display name" style={styles.input} />
              <TextInput value={childEditDrafts[child.id]?.legalName ?? child.legalName ?? ''} onChangeText={value => setChildEditDraft(child.id, 'legalName', value)} placeholder="Legal name" style={styles.input} />
              <TextInput value={childEditDrafts[child.id]?.preferredName ?? child.preferredName ?? ''} onChangeText={value => setChildEditDraft(child.id, 'preferredName', value)} placeholder="Preferred name" style={styles.input} />
              <TextInput value={childEditDrafts[child.id]?.birthdate ?? child.birthdate ?? ''} onChangeText={value => setChildEditDraft(child.id, 'birthdate', value)} placeholder="Birthdate" style={styles.input} />
              <TextInput value={childEditDrafts[child.id]?.ssnFull ?? childToEditDraft(child).ssnFull} onChangeText={value => setChildEditDraft(child.id, 'ssnFull', value)} placeholder="SSN" style={styles.input} keyboardType="number-pad" maxLength={11} />
              <Text style={styles.section}>Child information</Text>
              <Text style={styles.help}>Allergies, conditions, diet, and daily care instructions belong with the child’s basic information so they are easy to find fast.</Text>
              <TextInput value={childEditDrafts[child.id]?.allergies ?? listToDraftText(child.medical.allergies)} onChangeText={value => setChildEditDraft(child.id, 'allergies', value)} placeholder="Allergies, comma separated" style={styles.input} />
              <TextInput value={childEditDrafts[child.id]?.conditions ?? listToDraftText(child.medical.conditions)} onChangeText={value => setChildEditDraft(child.id, 'conditions', value)} placeholder="Conditions, comma separated" style={styles.input} />
              <TextInput value={childEditDrafts[child.id]?.dietaryRestrictions ?? listToDraftText(child.medical.dietaryRestrictions)} onChangeText={value => setChildEditDraft(child.id, 'dietaryRestrictions', value)} placeholder="Dietary restrictions, comma separated" style={styles.input} />
              <TextInput value={childEditDrafts[child.id]?.careInstructions ?? child.medical.careInstructions ?? ''} onChangeText={value => setChildEditDraft(child.id, 'careInstructions', value)} placeholder="Care instructions" multiline style={styles.textArea} />
              <Text style={styles.section}>Doctors & care providers</Text>
              <Text style={styles.help}>Add as many doctors as needed: pediatrician, dentist, therapist, specialist, pharmacy contact, or another care provider.</Text>
              {(childEditDrafts[child.id]?.doctors ?? childToEditDraft(child).doctors).map((doctor, index) => (
                <View key={doctor.id} style={styles.doctorDraftBox}>
                  <Text style={styles.providerName}>Doctor {index + 1}</Text>
                  <TextInput value={doctor.doctorRole} onChangeText={value => setDoctorDraft(child.id, doctor.id, 'doctorRole', value)} placeholder="Role, ex: Pediatrician, Dentist, Therapist" style={styles.input} />
                  <TextInput value={doctor.doctorName} onChangeText={value => setDoctorDraft(child.id, doctor.id, 'doctorName', value)} placeholder="Doctor/provider name" style={styles.input} />
                  <TextInput value={doctor.doctorOffice} onChangeText={value => setDoctorDraft(child.id, doctor.id, 'doctorOffice', value)} placeholder="Office / clinic name" style={styles.input} />
                  <TextInput value={doctor.doctorLocation} onChangeText={value => setDoctorDraft(child.id, doctor.id, 'doctorLocation', value)} placeholder="Office location" style={styles.input} />
                  <TextInput value={doctor.doctorPhone} onChangeText={value => setDoctorDraft(child.id, doctor.id, 'doctorPhone', value)} placeholder="Office phone number" style={styles.input} keyboardType="phone-pad" />
                  <PrimaryButton tone="quiet" onPress={() => removeDoctorDraft(child.id, doctor.id)}>Remove this doctor</PrimaryButton>
                </View>
              ))}
              <PrimaryButton tone="quiet" onPress={() => addDoctorDraft(child.id)}>+ Add another doctor</PrimaryButton>
              <View style={styles.buttonGap}>
                <PrimaryButton onPress={() => saveChildEdit(child)}>Save child info</PrimaryButton>
                <PrimaryButton tone="quiet" onPress={() => cancelChildEdit(child.id)}>Cancel</PrimaryButton>
              </View>
            </View>
          ) : (
            <View style={styles.buttonGap}>
              <PrimaryButton onPress={() => startChildEdit(child)}>Edit child info</PrimaryButton>
              <PrimaryButton tone="quiet" onPress={() => removeChild(child.id)}>Remove profile draft</PrimaryButton>
            </View>
          )}

          {!activeEditChildIds[child.id] ? (
            <>
          <Text style={styles.section}>Custom child information</Text>
          <Text style={styles.help}>Tap +, name the detail on the left, then ParentVault jumps you into the blank notes field on the right.</Text>
          {child.customInfo?.length ? child.customInfo.map(item => (
            <View key={item.id} style={styles.provider}>
              <Text style={styles.providerName}>{item.title}</Text>
              <Text>{item.value}</Text>
              <PrimaryButton tone="quiet" onPress={() => removeCustomInfo(child.id, item.id)}>Remove custom info</PrimaryButton>
            </View>
          )) : <Text>No custom info saved yet.</Text>}
          {activeCustomInfoChildIds[child.id] ? (
            <>
              <View style={styles.customDetailRow}>
                <TextInput
                  ref={input => { customTitleInputRefs.current[child.id] = input; }}
                  value={customInfoDrafts[child.id]?.title ?? ''}
                  onChangeText={value => setCustomInfoDraft(child.id, 'title', value)}
                  onSubmitEditing={() => focusCustomInfoValue(child.id)}
                  placeholder="Label"
                  returnKeyType="next"
                  blurOnSubmit={false}
                  style={[styles.input, styles.customTitleInput]}
                />
                <TextInput
                  ref={input => { customValueInputRefs.current[child.id] = input; }}
                  value={customInfoDrafts[child.id]?.value ?? ''}
                  onChangeText={value => setCustomInfoDraft(child.id, 'value', value)}
                  placeholder="Blank notes field"
                  multiline
                  style={[styles.textArea, styles.customValueInput]}
                />
              </View>
              <PrimaryButton onPress={() => addCustomInfo(child.id)}>Save this detail</PrimaryButton>
            </>
          ) : (
            <PrimaryButton onPress={() => startCustomInfoDraft(child.id)}>+ Add child detail</PrimaryButton>
          )}

          <Text style={styles.section}>Child information</Text>
          <Text>Allergies: {child.medical.allergies.length ? child.medical.allergies.join(', ') : 'None listed'}</Text>
          <Text>Conditions: {child.medical.conditions.length ? child.medical.conditions.join(', ') : 'None listed'}</Text>
          <Text>Dietary restrictions: {child.medical.dietaryRestrictions.length ? child.medical.dietaryRestrictions.join(', ') : 'None listed'}</Text>
          {child.medical.careInstructions ? <Text>Care instructions: {child.medical.careInstructions}</Text> : null}

          <Text style={styles.section}>Medications</Text>
          {child.medical.medications.length ? child.medical.medications.map(med => {
            const pharmacy = child.careProviders.find(provider => provider.id === med.pharmacyProviderId);
            return (
              <View key={med.id} style={styles.provider}>
                <Text style={styles.providerName}>- {med.name} {med.dosage ? ` - ${med.dosage}` : ''}</Text>
                {med.instructions ? <Text>Instructions: {med.instructions}</Text> : null}
                {med.scheduleText ? <Text>Schedule: {med.scheduleText}</Text> : null}
                {pharmacy ? <Text>Filled at: {pharmacy.organizationName ?? pharmacy.personName} {pharmacy.phone || ''}</Text> : null}
                {med.refillInstructions ? <Text>Refill: {med.refillInstructions}</Text> : null}
                {med.refillRemainingCount !== undefined ? <Text>Refills remaining: {med.refillRemainingCount}</Text> : null}
                {med.nextRefillDueAt ? <Text>Next refill due: {med.nextRefillDueAt}</Text> : null}
              </View>
            );
          }) : <Text>None listed</Text>}

          <Text style={styles.section}>Doctors & care providers</Text>
          {child.careProviders.map(provider => (
            <View key={provider.id} style={styles.provider}>
              <Text style={styles.providerName}>{provider.isPrimary ? '* ' : ''}{provider.personName}</Text>
              <Text>{provider.type}{provider.role ? ` - ${provider.role}` : ''}</Text>
              {provider.organizationName ? <Text>{provider.organizationName}</Text> : null}
              {provider.phone ? <Text>Phone: {provider.phone}</Text> : null}
              {provider.afterHoursPhone ? <Text>After-hours: {provider.afterHoursPhone}</Text> : null}
              <Text>Location: {formatAddress(provider.address)}</Text>
              {provider.officeHours ? <Text>Hours: {provider.officeHours}</Text> : null}
              {provider.type === 'pharmacy' && provider.portalUrl ? <Text>Refill portal/app: {provider.portalUrl}</Text> : null}
              {provider.type === 'pharmacy' && provider.acceptsElectronicPrescriptions !== undefined ? <Text>E-prescriptions: {provider.acceptsElectronicPrescriptions ? 'yes' : 'no'}</Text> : null}
              {provider.type === 'pharmacy' && provider.preferredForRefills ? <Text>Preferred refill pharmacy</Text> : null}
            </View>
          ))}

          <Text style={styles.section}>School</Text>
          {child.school ? (
            <>
              <Text>{child.school.schoolName}{child.school.grade ? ` - ${child.school.grade}` : ''}</Text>
              {child.school.districtName ? <Text>District: {child.school.districtName}</Text> : null}
              {child.school.teacherName ? <Text>Teacher: {child.school.teacherName}</Text> : null}
              {child.school.mainPhone ? <Text>Main phone: {child.school.mainPhone}</Text> : null}
              {child.school.attendancePhone ? <Text>Attendance: {child.school.attendancePhone}</Text> : null}
              {child.school.websiteUrl ? <Text>Website: {child.school.websiteUrl}</Text> : null}
              {child.school.calendarUrl ? <Text>Calendar: {child.school.calendarUrl}</Text> : null}
              {child.school.officeHours ? <Text>Office hours: {child.school.officeHours}</Text> : null}
              {child.school.schoolHours ? <Text>School hours: {child.school.schoolHours}</Text> : null}
              <Text>Location: {formatAddress(child.school.address)}</Text>
              {child.school.pickupInstructions ? <Text>Pickup: {child.school.pickupInstructions}</Text> : null}
              {child.school.calendarDates?.length ? <Text>Saved calendar dates: {child.school.calendarDates.length}</Text> : null}
            </>
          ) : <Text>Not set</Text>}

          <Text style={styles.section}>Emergency contacts</Text>
          {child.contacts.map(contact => <Text key={contact.id}>- {contact.name}, {contact.relationship} {contact.phone || ''}{contact.allowedPickup ? ' - pickup allowed' : ''}</Text>)}

          <Text style={styles.section}>Insurance</Text>
          {child.insurance.length ? child.insurance.map(policy => (
            <View key={policy.id} style={styles.provider}>
              <Text style={styles.providerName}>- {policy.providerName}{policy.planName ? ` - ${policy.planName}` : ''}</Text>
              {policy.policyHolderName ? <Text>Policy holder: {policy.policyHolderName}{policy.relationshipToChild ? ` (${policy.relationshipToChild})` : ''}</Text> : null}
              {policy.phone ? <Text>Main phone: {policy.phone}</Text> : null}
              {policy.nurseLinePhone ? <Text>Nurse line: {policy.nurseLinePhone}</Text> : null}
              {policy.pharmacyBenefitsPhone ? <Text>Pharmacy benefits: {policy.pharmacyBenefitsPhone}</Text> : null}
              {policy.portalUrl ? <Text>Portal: {policy.portalUrl}</Text> : null}
              {policy.copayNotes ? <Text>Copay: {policy.copayNotes}</Text> : null}
              {policy.priorAuthorizationNotes ? <Text>Prior auth: {policy.priorAuthorizationNotes}</Text> : null}
            </View>
          )) : <Text>Not set</Text>}

          <Text style={styles.section}>Bot checklist</Text>
          {findChildVaultGaps(child).slice(0, 5).map(gap => <Text key={gap.id}>- {gap.question}</Text>)}
          {!findChildVaultGaps(child).length ? <Text>Major baseline details are filled. The bot will keep watching for stale or missing info.</Text> : null}
            </>
          ) : null}
        </Card>
      ))}

      {children.length === 0 ? (
        <PrimaryButton onPress={addChildAndOpenForm}>Add Child</PrimaryButton>
      ) : (
        <View style={styles.buttonGap}>
          <PrimaryButton onPress={addChildAndOpenForm}>Add Child</PrimaryButton>
          <Text style={{ color: theme.muted, textAlign: 'center', marginTop: 8 }}>Or swipe to clear all data.</Text>
        </View>
      )}

      <Card>
        <Text style={styles.section}>Create a school draft</Text>
        <Text style={styles.help}>Enter a school name, open hours, and known breaks. ParentVault will turn confirmed no-school dates into calendar items.</Text>
        <TextInput value={schoolQuery} onChangeText={setSchoolQuery} placeholder="School name" style={styles.input} />
        <View style={styles.rowInputs}>
          <TextInput value={city} onChangeText={setCity} placeholder="City" style={[styles.input, styles.flexInput]} />
          <TextInput value={stateCode} onChangeText={setStateCode} placeholder="State" style={[styles.input, styles.stateInput]} autoCapitalize="characters" />
        </View>
        <Text style={styles.section}>School contact</Text>
        <TextInput value={schoolCalendarDraft.location} onChangeText={value => setSchoolCalendarField('location', value)} placeholder="School location / street address" style={styles.input} />
        <TextInput value={schoolCalendarDraft.phoneNumber} onChangeText={value => setSchoolCalendarField('phoneNumber', value)} placeholder="School phone number" style={styles.input} keyboardType="phone-pad" />
        <TextInput value={schoolCalendarDraft.principalName} onChangeText={value => setSchoolCalendarField('principalName', value)} placeholder="Principal name" style={styles.input} />
        <Text style={styles.section}>Teacher contact</Text>
        <TextInput value={schoolCalendarDraft.teacherName} onChangeText={value => setSchoolCalendarField('teacherName', value)} placeholder="Teacher name" style={styles.input} />
        <TextInput value={schoolCalendarDraft.teacherPhone} onChangeText={value => setSchoolCalendarField('teacherPhone', value)} placeholder="Teacher phone" style={styles.input} keyboardType="phone-pad" />
        <TextInput value={schoolCalendarDraft.teacherEmail} onChangeText={value => setSchoolCalendarField('teacherEmail', value)} placeholder="Teacher email" style={styles.input} keyboardType="email-address" autoCapitalize="none" />
        <Text style={styles.section}>School open times</Text>
        <TextInput value={schoolCalendarDraft.officeHours} onChangeText={value => setSchoolCalendarField('officeHours', value)} placeholder="Office hours, ex: Mon-Fri 7:30 AM - 3:30 PM" style={styles.input} />
        <TextInput value={schoolCalendarDraft.schoolHours} onChangeText={value => setSchoolCalendarField('schoolHours', value)} placeholder="School hours, ex: 8:00 AM - 2:45 PM" style={styles.input} />

        <Text style={styles.section}>School breaks / days off</Text>
        <Text style={styles.help}>Use dates like 2026-03-16. End date can be blank for a single day.</Text>
        <View style={styles.calendarDraftRow}>
          <Text style={styles.calendarDraftLabel}>Spring break</Text>
          <TextInput value={schoolCalendarDraft.springBreakStart} onChangeText={value => setSchoolCalendarField('springBreakStart', value)} placeholder="Start date" style={[styles.input, styles.flexInput]} />
          <TextInput value={schoolCalendarDraft.springBreakEnd} onChangeText={value => setSchoolCalendarField('springBreakEnd', value)} placeholder="End date" style={[styles.input, styles.flexInput]} />
        </View>
        <View style={styles.calendarDraftRow}>
          <Text style={styles.calendarDraftLabel}>Christmas break</Text>
          <TextInput value={schoolCalendarDraft.christmasBreakStart} onChangeText={value => setSchoolCalendarField('christmasBreakStart', value)} placeholder="Start date" style={[styles.input, styles.flexInput]} />
          <TextInput value={schoolCalendarDraft.christmasBreakEnd} onChangeText={value => setSchoolCalendarField('christmasBreakEnd', value)} placeholder="End date" style={[styles.input, styles.flexInput]} />
        </View>
        <View style={styles.calendarDraftRow}>
          <Text style={styles.calendarDraftLabel}>New Year’s break</Text>
          <TextInput value={schoolCalendarDraft.newYearsBreakStart} onChangeText={value => setSchoolCalendarField('newYearsBreakStart', value)} placeholder="Start date" style={[styles.input, styles.flexInput]} />
          <TextInput value={schoolCalendarDraft.newYearsBreakEnd} onChangeText={value => setSchoolCalendarField('newYearsBreakEnd', value)} placeholder="End date" style={[styles.input, styles.flexInput]} />
        </View>
        <View style={styles.calendarDraftRow}>
          <Text style={styles.calendarDraftLabel}>Fall break</Text>
          <TextInput value={schoolCalendarDraft.fallBreakStart} onChangeText={value => setSchoolCalendarField('fallBreakStart', value)} placeholder="Start date" style={[styles.input, styles.flexInput]} />
          <TextInput value={schoolCalendarDraft.fallBreakEnd} onChangeText={value => setSchoolCalendarField('fallBreakEnd', value)} placeholder="End date" style={[styles.input, styles.flexInput]} />
        </View>
        {schoolCalendarDraft.extraDaysOff.map(day => (
          <View key={day.id} style={styles.extraDayOffBox}>
            <TextInput value={day.title} onChangeText={value => updateExtraDayOffDraft(day.id, 'title', value)} placeholder="Day off title, ex: Teacher workday" style={styles.input} />
            <View style={styles.rowInputs}>
              <TextInput value={day.startsAt} onChangeText={value => updateExtraDayOffDraft(day.id, 'startsAt', value)} placeholder="Start date" style={[styles.input, styles.flexInput]} />
              <TextInput value={day.endsAt} onChangeText={value => updateExtraDayOffDraft(day.id, 'endsAt', value)} placeholder="End date" style={[styles.input, styles.flexInput]} />
            </View>
            <PrimaryButton tone="quiet" onPress={() => removeExtraDayOffDraft(day.id)}>Remove this day off</PrimaryButton>
          </View>
        ))}
        <PrimaryButton tone="quiet" onPress={addExtraDayOffDraft}>+ Add another day off</PrimaryButton>
        <PrimaryButton onPress={enrichSchool}>Create school draft</PrimaryButton>
      </Card>

      {suggestion ? (
        <Card>
          <Text style={styles.section}>Confirm school enrichment</Text>
          <Text style={styles.help}>Nothing is saved until you confirm. Add official phone, website, hours, pickup rules, and calendar dates before relying on it.</Text>
          <Text>School: {suggestion.school.schoolName}</Text>
          {suggestion.school.districtName ? <Text>District: {suggestion.school.districtName}</Text> : null}
          {suggestion.school.mainPhone ? <Text>Main phone: {suggestion.school.mainPhone}</Text> : null}
          {suggestion.school.officeHours ? <Text>Office hours: {suggestion.school.officeHours}</Text> : null}
          {suggestion.school.schoolHours ? <Text>School hours: {suggestion.school.schoolHours}</Text> : null}
          <Text>Location: {formatAddress(suggestion.school.address)}</Text>
          {suggestion.calendarDates.length ? (
            <>
              <Text style={styles.section}>Out-of-school / calendar dates</Text>
              {suggestion.calendarDates.map(date => <Text key={date.id}>- {date.title} - {new Date(date.startsAt).toLocaleDateString()} {date.noSchool ? '(no school)' : ''}</Text>)}
            </>
          ) : <Text style={styles.help}>No calendar dates were created automatically.</Text>}
          <Text style={styles.section}>Sources</Text>
          {suggestion.sources.map(source => <Text key={source}>- {source}</Text>)}
          {suggestion.warnings.map(warning => <Text key={warning} style={styles.warningText}>Warning: {warning}</Text>)}
          <PrimaryButton onPress={confirmSchoolSuggestion}>Confirm and add to vault</PrimaryButton>
          <PrimaryButton tone="quiet" onPress={() => setSuggestion(null)}>Cancel</PrimaryButton>
        </Card>
      ) : null}


      {children.length > 0 && (
        <PrimaryButton tone="quiet" onPress={wipe}>Wipe all data</PrimaryButton>
      )}
    </ScrollView>
  );
}

// Screen-specific styles. Keeping them in this file makes the Profiles tab self-contained.
const createStyles = (theme: ReturnType<typeof useTheme>) => StyleSheet.create({
  container: { padding: 18, paddingBottom: 34 },
  title: { fontSize: 34, fontWeight: '900', color: theme.text, letterSpacing: -0.8, marginTop: 4 },
  subtitle: { color: theme.muted, marginTop: 6, marginBottom: 18, lineHeight: 21 },
  name: { fontSize: 20, fontWeight: '800', marginBottom: 6 },
  nannyRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  nannyAvatar: { width: 64, height: 64, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fef3c7', borderWidth: 2, borderColor: '#fbbf24' },
  nannyFace: { fontSize: 36 },
  nannyBubble: { flex: 1, backgroundColor: theme.primarySoft, borderRadius: 18, padding: 12, borderWidth: 1, borderColor: theme.border },
  nannyName: { color: theme.primary, fontWeight: '900', marginBottom: 2 },
  nannyEyebrow: { color: theme.subtle, fontWeight: '800', fontSize: 12, textTransform: 'uppercase' },
  nannyTitle: { color: theme.text, fontWeight: '900', fontSize: 17, marginTop: 4 },
  nannyBody: { color: theme.muted, marginTop: 6, lineHeight: 20 },
  progressDots: { flexDirection: 'row', gap: 6, marginTop: 12, justifyContent: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#cbd5e1' },
  activeDot: { backgroundColor: theme.primary, width: 18 },
  onboardingButtons: { marginTop: 8 },
  section: { fontWeight: '900', marginTop: 16, marginBottom: 6, color: theme.text, letterSpacing: 0.2 },
  help: { color: theme.muted, marginBottom: 10 },
  input: { minHeight: 48, borderRadius: 16, borderWidth: 1, borderColor: theme.inputBorder, padding: 12, backgroundColor: theme.input, marginTop: 8, color: theme.text },
  textArea: { minHeight: 104, borderRadius: 16, borderWidth: 1, borderColor: theme.inputBorder, padding: 12, backgroundColor: theme.input, marginTop: 8, color: theme.text, textAlignVertical: 'top' },
  editPanel: { marginTop: 12, borderRadius: 14, borderWidth: 1, borderColor: theme.border, padding: 12, backgroundColor: theme.elevated },
  buttonGap: { gap: 8, marginTop: 10 },
  customDetailRow: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  customTitleInput: { flex: 1, minWidth: 120 },
  customValueInput: { flex: 2, minHeight: 44 },
  rowInputs: { flexDirection: 'row', gap: 8 },
  calendarDraftRow: { gap: 8, marginTop: 8 },
  calendarDraftLabel: { color: theme.text, fontWeight: '800', marginTop: 8 },
  extraDayOffBox: { borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 10, marginTop: 10, backgroundColor: theme.elevated },
  doctorDraftBox: { borderWidth: 1, borderColor: theme.border, borderRadius: 14, padding: 10, marginTop: 10, backgroundColor: theme.card },
  flexInput: { flex: 1 },
  stateInput: { width: 90 },
  provider: { borderLeftWidth: 3, borderLeftColor: theme.primary, paddingLeft: 10, marginTop: 8 },
  providerName: { fontWeight: '800' },
  warning: { backgroundColor: '#fff7ed', borderRadius: 12, padding: 12, marginTop: 10 },
  warningText: { color: '#9a3412', marginTop: 6 }
});
