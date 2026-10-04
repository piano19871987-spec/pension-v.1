export interface PensionRecord {
  id: string;
  province: string;
  year: number; // พ.ศ. (Buddhist Era) เช่น 2567, 2568, 2569
  month: number; // 1 - 12
  monthName?: string; // มกราคม, กุมภาพันธ์, etc.
  approvedCount: number; // จำนวนที่อนุมัติ (ราย)
  recordedBy: string; // ผู้บันทึก
  recordedByEmail?: string;
  userId?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  // Optional backwards compatibility fields if existing documents contain them
  pensionType?: string;
  approvedAmount?: number;
}

export const TARGET_PROVINCES = [
  'ราชบุรี',
  'กาญจนบุรี',
  'สุพรรณบุรี',
  'นครปฐม',
  'สมุทรสาคร',
  'สมุทรสงคราม',
  'เพชรบุรี',
  'ประจวบคีรีขันธ์',
] as const;

export type TargetProvince = (typeof TARGET_PROVINCES)[number];

export const THAI_MONTHS = [
  { value: 1, name: 'มกราคม', short: 'ม.ค.' },
  { value: 2, name: 'กุมภาพันธ์', short: 'ก.พ.' },
  { value: 3, name: 'มีนาคม', short: 'มี.ค.' },
  { value: 4, name: 'เมษายน', short: 'เม.ย.' },
  { value: 5, name: 'พฤษภาคม', short: 'พ.ค.' },
  { value: 6, name: 'มิถุนายน', short: 'มิ.ย.' },
  { value: 7, name: 'กรกฎาคม', short: 'ก.ค.' },
  { value: 8, name: 'สิงหาคม', short: 'ส.ค.' },
  { value: 9, name: 'กันยายน', short: 'ก.ย.' },
  { value: 10, name: 'ตุลาคม', short: 'ต.ค.' },
  { value: 11, name: 'พฤศจิกายน', short: 'พ.ย.' },
  { value: 12, name: 'ธันวาคม', short: 'ธ.ค.' },
] as const;

export const PROVINCE_COLORS: Record<string, string> = {
  ราชบุรี: '#3B82F6', // Blue
  กาญจนบุรี: '#10B981', // Emerald
  สุพรรณบุรี: '#6366F1', // Indigo
  นครปฐม: '#F59E0B', // Amber
  สมุทรสาคร: '#8B5CF6', // Purple
  สมุทรสงคราม: '#EC4899', // Pink
  เพชรบุรี: '#14B8A6', // Teal
  ประจวบคีรีขันธ์: '#F97316', // Orange
};
