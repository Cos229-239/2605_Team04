/**
 * PARENTVAULT-COMMENTARY
 *
 * Shared urgency helper for the Today dashboard and future reminder surfaces.
 * Red means overdue/needs attention, yellow means upcoming soon, green means handled or lower-risk.
 */

export type UrgencyLevel = 'red' | 'yellow' | 'green';

const oneHourMs = 60 * 60 * 1000;
const oneDayMs = 24 * oneHourMs;

export const urgencyCopy: Record<UrgencyLevel, { label: string; color: string; background: string }> = {
  red: { label: 'Needs attention', color: '#991b1b', background: '#fee2e2' },
  yellow: { label: 'Coming soon', color: '#92400e', background: '#fef3c7' },
  green: { label: 'Handled', color: '#065f46', background: '#d1fae5' }
};

export const getScheduleUrgency = (startsAt: string, takenAt?: string): UrgencyLevel => {
  if (takenAt) return 'green';
  const dueIn = new Date(startsAt).getTime() - Date.now();
  if (dueIn < 0) return 'red';
  if (dueIn <= oneDayMs) return 'yellow';
  return 'green';
};
