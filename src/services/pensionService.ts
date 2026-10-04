import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../firebase';
import { PensionRecord, TARGET_PROVINCES, THAI_MONTHS } from '../types/pension';

const COLLECTION_NAME = 'pension_records';

export function subscribePensionRecords(
  onData: (records: PensionRecord[]) => void,
  onError?: (err: unknown) => void
): Unsubscribe {
  const collRef = collection(db, COLLECTION_NAME);
  const q = query(collRef, orderBy('year', 'desc'), orderBy('month', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: PensionRecord[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        records.push({
          id: docSnap.id,
          province: data.province,
          year: data.year,
          month: data.month,
          monthName: data.monthName || THAI_MONTHS.find((m) => m.value === data.month)?.name || `เดือน ${data.month}`,
          approvedCount: data.approvedCount || 0,
          recordedBy: data.recordedBy || '',
          recordedByEmail: data.recordedByEmail || '',
          userId: data.userId || 'guest',
          notes: data.notes || '',
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          pensionType: data.pensionType,
          approvedAmount: data.approvedAmount,
        });
      });
      onData(records);
    },
    (error) => {
      console.error('Error listening to pension records:', error);
      if (onError) onError(error);
      handleFirestoreError(error, OperationType.GET, COLLECTION_NAME);
    }
  );
}

export async function addPensionRecord(
  data: Omit<PensionRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const currentUid = auth.currentUser?.uid || data.userId || 'guest';

  // generate sanitized valid id (^[a-zA-Z0-9_-]+$)
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const recordId = `rec_${data.year}_${data.month}_${timestamp}_${randomStr}`;

  const monthObj = THAI_MONTHS.find((m) => m.value === data.month);
  const nowIso = new Date().toISOString();

  const payload: PensionRecord = {
    id: recordId,
    province: data.province,
    year: Number(data.year),
    month: Number(data.month),
    monthName: monthObj ? monthObj.name : `เดือน ${data.month}`,
    approvedCount: Number(data.approvedCount) || 0,
    recordedBy: data.recordedBy.trim(),
    recordedByEmail: auth.currentUser?.email || data.recordedByEmail || '',
    userId: currentUid,
    notes: data.notes ? data.notes.trim() : '',
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  try {
    const docRef = doc(db, COLLECTION_NAME, recordId);
    await setDoc(docRef, payload);
    return recordId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `${COLLECTION_NAME}/${recordId}`);
  }
}

export async function updatePensionRecord(
  id: string,
  data: Partial<Omit<PensionRecord, 'id' | 'createdAt'>>
): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  const nowIso = new Date().toISOString();

  const updateData: Record<string, any> = {
    ...data,
    updatedAt: nowIso,
  };

  if (data.month) {
    const monthObj = THAI_MONTHS.find((m) => m.value === Number(data.month));
    if (monthObj) updateData.monthName = monthObj.name;
    updateData.month = Number(data.month);
  }
  if (data.year) updateData.year = Number(data.year);
  if (data.approvedCount !== undefined) updateData.approvedCount = Number(data.approvedCount);

  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await setDoc(docRef, updateData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePensionRecord(id: string): Promise<void> {
  const path = `${COLLECTION_NAME}/${id}`;
  try {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Seeding realistic sample data for demo purposes across all 8 provinces
 */
export async function seedSampleData(
  officerName: string = 'เจ้าหน้าที่สถิติบำเหน็จบำนาญ'
): Promise<number> {
  const currentUid = auth.currentUser?.uid || 'guest';
  const baseYear = 2569;

  const sampleCounts: Record<string, number[]> = {
    ราชบุรี: [142, 138, 155, 120, 160, 145, 170, 165, 180, 190, 175, 185],
    กาญจนบุรี: [110, 105, 125, 95, 130, 115, 140, 135, 150, 160, 145, 155],
    นครปฐม: [180, 175, 195, 160, 210, 190, 220, 215, 230, 250, 235, 245],
    สมุทรสาคร: [95, 90, 105, 85, 110, 100, 115, 110, 125, 135, 120, 130],
    สมุทรสงคราม: [45, 42, 50, 40, 55, 48, 58, 52, 60, 65, 58, 62],
    เพชรบุรี: [85, 80, 92, 75, 98, 88, 102, 95, 110, 118, 105, 112],
    ประจวบคีรีขันธ์: [90, 85, 98, 80, 105, 92, 110, 102, 115, 122, 110, 118],
    สุพรรณบุรี: [130, 125, 140, 115, 145, 135, 155, 150, 165, 175, 160, 170],
  };

  let count = 0;
  const monthsToSeed = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  for (const province of TARGET_PROVINCES) {
    for (const m of monthsToSeed) {
      const idx = m - 1;
      const countVal = sampleCounts[province]?.[idx] || Math.floor(Math.random() * 80 + 40);

      await addPensionRecord({
        province,
        year: baseYear,
        month: m,
        monthName: THAI_MONTHS[idx].name,
        approvedCount: countVal,
        recordedBy: officerName,
        notes: `ข้อมูลสถิติรอบการอนุมัติ ประจำงวดที่ ${m}/${baseYear}`,
        userId: currentUid,
      });
      count++;
    }
  }

  return count;
}
