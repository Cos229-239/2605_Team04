/**
 * Local-only development seed importer.
 *
 * This intentionally loads from an ignored file under apps/mobile/public/dev-seed so Luke can test
 * real-looking ParentVault data locally without committing private child details to GitHub.
 *
 * Usage in web dev: open /?seedLocal=1. The file must exist at:
 * apps/mobile/public/dev-seed/parentvault-local-seed.json
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChildProfile, JournalEntry, ScheduleItem } from '@parentvault/shared';

const ONBOARDING_COMPLETE_KEY = 'parentvault:onboardingComplete';
const VAULT_DATA_KEY = 'parentvault:vaultData:v1';
const SCHEDULE_USER_BASELINE_KEY = 'parentvault:scheduleUserBaseline:v1';
const LOCAL_SEED_URL = '/dev-seed/parentvault-local-seed.json';

type LocalSeedVaultData = {
  children?: ChildProfile[];
  schedule?: ScheduleItem[];
  journal?: JournalEntry[];
};

const asArray = <T>(value: T[] | undefined): T[] => Array.isArray(value) ? value : [];

export async function applyLocalSeedFromQueryIfRequested() {
  if (!__DEV__ || typeof window === 'undefined') return false;

  const url = new URL(window.location.href);
  if (url.searchParams.get('seedLocal') !== '1') return false;

  const response = await fetch(LOCAL_SEED_URL, { cache: 'no-store' });
  if (!response.ok) throw new Error(`Local seed file not found: ${LOCAL_SEED_URL}`);

  const seed = await response.json() as LocalSeedVaultData;
  const vaultData = {
    children: asArray(seed.children),
    schedule: asArray(seed.schedule),
    journal: asArray(seed.journal)
  };

  await Promise.all([
    AsyncStorage.setItem(VAULT_DATA_KEY, JSON.stringify(vaultData)),
    AsyncStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true'),
    AsyncStorage.setItem(SCHEDULE_USER_BASELINE_KEY, 'true')
  ]);

  url.searchParams.delete('seedLocal');
  url.searchParams.set('seeded', 'local');
  window.history.replaceState({}, '', url.toString());
  return true;
}
