import React, { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  TARGET_PROVINCES,
  THAI_MONTHS,
  PensionRecord,
} from '../types/pension';
import { addPensionRecord, updatePensionRecord } from '../services/pensionService';
import {
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Save,
  User as UserIcon,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface PensionFormProps {
  currentUser: User | null;
  onLogin: () => void;
  onRecordSaved: (recordId: string) => void;
  editingRecord?: PensionRecord | null;
  onCancelEdit?: () => void;
}

// Available years strictly from 2569 to 2576 as requested
const AVAILABLE_YEARS = [2569, 2570, 2571, 2572, 2573, 2574, 2575, 2576] as const;

export const PensionForm: React.FC<PensionFormProps> = ({
  currentUser,
  onRecordSaved,
  editingRecord,
  onCancelEdit,
}) => {
  const [province, setProvince] = useState<string>(TARGET_PROVINCES[0]);
  const [year, setYear] = useState<string>('2569');
  const [month, setMonth] = useState<string>('1'); // Default to 1 (มกราคม) or empty
  const [approvedCount, setApprovedCount] = useState<string>('');
  const [recordedBy, setRecordedBy] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Set default officer name from logged in user if available, or load remembered name
  useEffect(() => {
    if (currentUser?.displayName && !recordedBy && !editingRecord) {
      setRecordedBy(currentUser.displayName);
    } else if (!recordedBy && !editingRecord) {
      const savedName = localStorage.getItem('last_pension_officer_name');
      if (savedName) setRecordedBy(savedName);
    }
  }, [currentUser, editingRecord]);

  // Load record data if editing
  useEffect(() => {
    if (editingRecord) {
      setProvince(editingRecord.province);
      setYear(editingRecord.year.toString());
      setMonth(editingRecord.month.toString());
      setApprovedCount(editingRecord.approvedCount.toString());
      setRecordedBy(editingRecord.recordedBy);
      setNotes(editingRecord.notes || '');
    }
  }, [editingRecord]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Strict validation: province, month, year, approvedCount, recordedBy
    if (!province) {
      setErrorMessage('กรุณาระบุจังหวัด');
      return;
    }

    if (!month || month === '') {
      setErrorMessage('กรุณาระบุเดือน (ไม่สามารถเว้นว่างได้)');
      return;
    }

    const monthNum = parseInt(month, 10);
    if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      setErrorMessage('กรุณาระบุเดือนที่ถูกต้อง (1-12)');
      return;
    }

    if (!year || year === '') {
      setErrorMessage('กรุณาระบุปี พ.ศ. (ไม่สามารถเว้นว่างได้)');
      return;
    }

    const yearNum = parseInt(year, 10);
    if (isNaN(yearNum) || yearNum < 2569 || yearNum > 2576) {
      setErrorMessage('กรุณาระบุปี พ.ศ. ระหว่าง 2569 - 2576');
      return;
    }

    if (approvedCount.trim() === '') {
      setErrorMessage('กรุณาระบุจำนวนที่อนุมัติ (ไม่สามารถเว้นว่างได้)');
      return;
    }

    const countNum = parseInt(approvedCount, 10);
    if (isNaN(countNum) || countNum < 0) {
      setErrorMessage('กรุณาระบุจำนวนที่อนุมัติเป็นตัวเลขที่ถูกต้อง (ตั้งแต่ 0 ขึ้นไป)');
      return;
    }

    if (!recordedBy || recordedBy.trim() === '') {
      setErrorMessage('กรุณาระบุชื่อผู้บันทึก (ไม่สามารถเว้นว่างได้)');
      return;
    }

    setIsSubmitting(true);
    try {
      // Remember officer name locally for convenience
      localStorage.setItem('last_pension_officer_name', recordedBy.trim());

      const monthNameStr = THAI_MONTHS.find(m => m.value === monthNum)?.name || `เดือน ${monthNum}`;

      if (editingRecord) {
        await updatePensionRecord(editingRecord.id, {
          province,
          year: yearNum,
          month: monthNum,
          approvedCount: countNum,
          recordedBy: recordedBy.trim(),
          notes: notes.trim(),
        });
        setSuccessMessage(`แก้ไขข้อมูลสถิติของ ${province} เรียบร้อยแล้ว`);
        setTimeout(() => {
          onRecordSaved(editingRecord.id);
        }, 1000);
      } else {
        const newId = await addPensionRecord({
          province,
          year: yearNum,
          month: monthNum,
          monthName: monthNameStr,
          approvedCount: countNum,
          recordedBy: recordedBy.trim(),
          notes: notes.trim(),
          userId: currentUser?.uid || 'guest',
          recordedByEmail: currentUser?.email || '',
        });
        setSuccessMessage(`บันทึกข้อมูลสถิติบำเหน็จบำนาญ จังหวัด${province} ประจำเดือน${monthNameStr} พ.ศ. ${yearNum} เรียบร้อยแล้ว`);
        // Reset count and notes for next entry
        setApprovedCount('');
        setNotes('');
        onRecordSaved(newId);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-4">
      {/* Header card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="pb-4 border-b border-slate-100">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            {editingRecord ? 'แก้ไขข้อมูลสถิติเดิม' : 'แบบฟอร์มบันทึกข้อมูลสถิติ'}
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            {editingRecord ? 'แก้ไขข้อมูลสถิติบำเหน็จบำนาญ' : 'บันทึกข้อมูลสถิติบำเหน็จบำนาญ'}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            กรอกข้อมูลสถิติการอนุมัติบำเหน็จบำนาญ (โครงการ pension-v1) ข้อมูลทุกช่องที่มีเครื่องหมายดอกจัน (*) จำเป็นต้องระบุ
          </p>
        </div>

        {/* Feedback alerts */}
        {successMessage && (
          <div className="mt-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm">สำเร็จ!</div>
              <div className="text-sm">{successMessage}</div>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-sm">กรุณาตรวจสอบข้อมูล</div>
              <div className="text-sm">{errorMessage}</div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Section 1: จังหวัด (เลือกจาก dropdown แทน tab) */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-amber-600" />
              <span>ระบุจังหวัด <span className="text-red-500 font-bold">*</span></span>
            </label>
            <select
              required
              value={province}
              onChange={(e) => setProvince(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition cursor-pointer"
            >
              <option value="" disabled>-- กรุณาเลือกจังหวัด --</option>
              {TARGET_PROVINCES.map((prov) => (
                <option key={prov} value={prov}>
                  จังหวัด{prov}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-400 mt-1">
              เลือก 1 จังหวัด จาก 8 จังหวัด: ราชบุรี, กาญจนบุรี, สุพรรณบุรี, นครปฐม, สมุทรสาคร, สมุทรสงคราม, เพชรบุรี หรือ ประจวบคีรีขันธ์
            </p>
          </div>

          {/* Section 2: ประจำเดือน และ ประจำปี พ.ศ. (ใส่เพียงชื่อเดือน และ ปี พ.ศ. 2569-2576) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>ระบุเดือน <span className="text-red-500 font-bold">*</span></span>
              </label>
              <select
                required
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition cursor-pointer"
              >
                <option value="" disabled>-- กรุณาเลือกเดือน --</option>
                {THAI_MONTHS.map((m) => (
                  <option key={m.value} value={m.value.toString()}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5">
                <span>ประจำปี พ.ศ. <span className="text-red-500 font-bold">*</span></span>
              </label>
              <select
                required
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition cursor-pointer"
              >
                <option value="" disabled>-- กรุณาเลือกปี พ.ศ. --</option>
                {AVAILABLE_YEARS.map((y) => (
                  <option key={y} value={y.toString()}>
                    พ.ศ. {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section 3: จำนวนที่อนุมัติ & ระบุชื่อผู้บันทึก */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-amber-600" />
                <span>ระบุจำนวนที่อนุมัติ (ราย/เรื่อง) <span className="text-red-500 font-bold">*</span></span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  placeholder="เช่น 150"
                  value={approvedCount}
                  onChange={(e) => setApprovedCount(e.target.value)}
                  className="w-full px-3.5 py-2.5 pr-14 rounded-xl border border-slate-300 bg-white text-slate-900 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
                />
                <span className="absolute right-3.5 top-3 text-xs font-semibold text-slate-400">
                  ราย
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                จำนวนผู้ได้รับการอนุมัติรับสิทธิบำเหน็จหรือบำนาญ (ต้องไม่เว้นว่าง)
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
                <UserIcon className="w-4 h-4 text-amber-600" />
                <span>ระบุชื่อผู้บันทึก <span className="text-red-500 font-bold">*</span></span>
              </label>
              <input
                type="text"
                required
                maxLength={100}
                placeholder="ชื่อ-สกุล หรือ ตำแหน่งเจ้าหน้าที่ผู้บันทึก"
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition"
              />
              <p className="text-xs text-slate-400 mt-1">
                เช่น นายสมชาย ใจดี (นักวิชาการเงินและบัญชี) (ต้องไม่เว้นว่าง)
              </p>
            </div>
          </div>

          {/* Section 4: หมายเหตุเพิ่มเติม */}
          <div>
            <label className="block text-sm font-semibold text-slate-800 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>หมายเหตุ / รายละเอียดเพิ่มเติม</span>
            </label>
            <textarea
              rows={2}
              maxLength={500}
              placeholder="บันทึกรายละเอียดเพิ่มเติม เช่น รอบพิจารณาพิเศษ หรือหมายเลขอ้างอิงมติ"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition text-sm"
            />
          </div>

          {/* Submit buttons */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-end gap-3">
            {editingRecord && onCancelEdit && (
              <button
                type="button"
                onClick={onCancelEdit}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-medium transition text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>ยกเลิกการแก้ไข</span>
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full sm:w-auto px-7 py-3 rounded-xl font-bold text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer ${
                isSubmitting
                  ? 'bg-amber-400 text-slate-900 cursor-wait opacity-80'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-[0.98]'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? 'กำลังบันทึกลง Firebase...'
                  : editingRecord
                  ? 'บันทึกการแก้ไขข้อมูล'
                  : 'บันทึกข้อมูลสถิติ'}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* Guide Card */}
      <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900">
        <div className="font-bold flex items-center gap-1.5 mb-1 text-amber-950">
          💡 ข้อแนะนำ:
        </div>
        <ul className="list-disc list-inside space-y-1 text-amber-900/90">
          <li>บังคับระบุ: จังหวัด, เดือน, ปี พ.ศ. (2569-2576), จำนวนที่อนุมัติ, และชื่อผู้บันทึก</li>
          <li>ข้อมูลจะถูกจัดเก็บใน Firestore โครงการ <span className="font-semibold">pension-v1</span> แบบ Real-time</li>
          <li>ครอบคลุม 8 จังหวัด ได้แก่ ราชบุรี, กาญจนบุรี, นครปฐม, สมุทรสาคร, สมุทรสงคราม, เพชรบุรี, ประจวบคีรีขันธ์, และสุพรรณบุรี</li>
        </ul>
      </div>
    </div>
  );
};
