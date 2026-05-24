import Dexie, { Table } from 'dexie';

export interface OfflineMSME {
  id?: number;
  localId: string;
  businessName: string;
  businessType: string;
  msmeCategory: string;
  formalityStatus: string;
  countyId: string;
  phone?: string;
  email?: string;
  ownerName?: string;
  ownerGender?: string;
  isYouthLed: boolean;
  isWomenLed: boolean;
  gpsLatitude?: number;
  gpsLongitude?: number;
  syncStatus: 'PENDING' | 'SYNCED' | 'FAILED' | 'CONFLICT';
  serverRecordId?: string;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
  payload: Record<string, any>;
}

export interface OfflineDraft {
  id?: number;
  entityType: 'MSME' | 'BDSP' | 'VERIFICATION';
  formData: Record<string, any>;
  savedAt: Date;
  label?: string;
}

export class SBAOfflineDB extends Dexie {
  offlineMSMEs!: Table<OfflineMSME, number>;
  offlineDrafts!: Table<OfflineDraft, number>;

  constructor() {
    super('sba-msme-portal-offline');
    this.version(1).stores({
      offlineMSMEs: '++id, localId, syncStatus, countyId, createdAt',
      offlineDrafts: '++id, entityType, savedAt',
    });
  }
}

export const offlineDB = new SBAOfflineDB();

// Helper to generate unique local ID
export function generateLocalId(): string {
  return `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Pending count
export async function getPendingCount(): Promise<number> {
  return offlineDB.offlineMSMEs.where('syncStatus').equals('PENDING').count();
}

// Save draft
export async function saveDraft(entityType: string, formData: Record<string, any>, label?: string): Promise<number> {
  return offlineDB.offlineDrafts.add({ entityType: entityType as any, formData, savedAt: new Date(), label });
}

// Get drafts
export async function getDrafts(entityType?: string) {
  if (entityType) return offlineDB.offlineDrafts.where('entityType').equals(entityType).toArray();
  return offlineDB.offlineDrafts.toArray();
}

// Delete draft
export async function deleteDraft(id: number) {
  return offlineDB.offlineDrafts.delete(id);
}
