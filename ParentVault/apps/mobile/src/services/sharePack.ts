/**
 * PARENTVAULT-COMMENTARY
 *
 * Review-first sharing helper. ParentVault should share specific selected facts, not an entire child vault.
 * This creates a plain-language preview that can later feed native share sheets, caregiver links, or PDFs.
 */

import type { ChildProfile } from '@parentvault/shared';

export type ShareFieldKey = 'allergies' | 'careInstructions' | 'schoolPickup' | 'emergencyContacts' | 'likesDislikes' | 'medicalNeeds';

export const defaultShareFields: ShareFieldKey[] = ['allergies', 'careInstructions', 'schoolPickup', 'emergencyContacts'];

const fieldLabels: Record<ShareFieldKey, string> = {
  allergies: 'Allergies',
  careInstructions: 'Care instructions',
  schoolPickup: 'School / pickup notes',
  emergencyContacts: 'Emergency contacts',
  likesDislikes: 'Likes, dislikes, and routines',
  medicalNeeds: 'Medical needs'
};

export const buildSpecificSharePreview = (child: ChildProfile | undefined, fields: ShareFieldKey[] = defaultShareFields) => {
  if (!child) return 'Add a child profile first, then choose exactly what to share.';

  const values: Record<ShareFieldKey, string> = {
    allergies: child.medical.allergies.length ? child.medical.allergies.join(', ') : 'Not listed',
    careInstructions: child.medical.careInstructions || 'Not listed',
    schoolPickup: [child.school?.schoolName, child.school?.pickupInstructions].filter(Boolean).join(' — ') || 'Not listed',
    emergencyContacts: child.contacts.length ? child.contacts.map(contact => `${contact.name}${contact.phone ? ` (${contact.phone})` : ''}`).join('; ') : 'Not listed',
    likesDislikes: child.customInfo?.filter(item => /like|dislike|routine|preference/i.test(item.title)).map(item => `${item.title}: ${item.value}`).join('; ') || 'Not listed',
    medicalNeeds: [child.medical.conditions.join(', '), child.medical.medications.filter(med => med.active).map(med => `${med.name}${med.dosage ? ` ${med.dosage}` : ''}`).join(', ')].filter(Boolean).join('; ') || 'Not listed'
  };

  return [`Share preview for ${child.displayName}`, 'Only the selected sections below would be shared:', ...fields.map(field => `• ${fieldLabels[field]}: ${values[field]}`)].join('\n');
};
