import React, { useState, useMemo } from 'react';
import {
  PensionRecord,
  TARGET_PROVINCES,
  THAI_MONTHS,
} from '../types/pension';
import { Printer, X, FileText } from 'lucide-react';

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: PensionRecord[];
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  records,
}) => {
  const currentBeYear = new Date().getFullYear() + 543;
  const currentMonthNum = new Date().getMonth() + 1;

  const [reportType, setReportType] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(2569);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonthNum);

  // Available years
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    for (let y = 2569; y <= 2576; y++) {
      yearsSet.add(y);
    }
    records.forEach((r) => yearsSet.add(r.year));
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [records]);

  // Filtered records
  const filteredRecords = useMemo(() => {
    if (reportType === 'monthly') {
      return records.filter(
        (r) => r.year === selectedYear && r.month === selectedMonth
      );
    }
    return records.filter((r) => r.year === selectedYear);
  }, [records, reportType, selectedYear, selectedMonth]);

  // Aggregate by 8 provinces
  const provinceSummary = useMemo(() => {
    return TARGET_PROVINCES.map((prov, index) => {
      const match = filteredRecords.filter((r) => r.province === prov);
      const totalCount = match.reduce((sum, r) => sum + r.approvedCount, 0);
      return {
        no: index + 1,
        province: prov,
        count: totalCount,
      };
    });
  }, [filteredRecords]);

  const totalCountAll = provinceSummary.reduce((sum, p) => sum + p.count, 0);
  const monthName = THAI_MONTHS.find((m) => m.value === selectedMonth)?.name;

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full my-8 shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="print:hidden p-4 bg-slate-900 text-white flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-base">
              ตัวอย่างรายงานสรุปสถิติบำเหน็จบำนาญ (ฉบับพิมพ์)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-slate-800 p-1 rounded-xl text-xs">
              <button
                onClick={() => setReportType('monthly')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  reportType === 'monthly'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300'
                }`}
              >
                รายเดือน
              </button>
              <button
                onClick={() => setReportType('yearly')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  reportType === 'yearly'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-300'
                }`}
              >
                รายปี
              </button>
            </div>

            {reportType === 'monthly' && (
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs border border-slate-700 font-medium"
              >
                {THAI_MONTHS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.name}
                  </option>
                ))}
              </select>
            )}

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-white text-xs border border-slate-700 font-medium"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  พ.ศ. {yr}
                </option>
              ))}
            </select>

            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์รายงาน</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Area */}
        <div className="p-8 sm:p-12 overflow-y-auto bg-white text-slate-900 font-sans print:p-0 print:overflow-visible">
          {/* Official Letterhead */}
          <div className="text-center pb-6 border-b-2 border-slate-900">
            <div className="w-16 h-16 mx-auto mb-2 flex items-center justify-center text-slate-900 font-serif font-black text-2xl border-2 border-slate-900 rounded-full">
              สถ.
            </div>
            <h2 className="text-xl font-bold tracking-tight">
              รายงานสรุปข้อมูลสถิติบำเหน็จบำนาญ
            </h2>
            <h3 className="text-base font-semibold text-slate-700 mt-1">
              กลุ่มพื้นที่ 8 จังหวัด (ราชบุรี กาญจนบุรี สุพรรณบุรี นครปฐม สมุทรสาคร สมุทรสงคราม เพชรบุรี ประจวบคีรีขันธ์)
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              {reportType === 'monthly'
                ? `ประจำเดือน ${monthName} พุทธศักราช ${selectedYear}`
                : `ประจำปี พุทธศักราช ${selectedYear}`}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              แหล่งข้อมูล: ระบบฐานข้อมูลกลาง Firebase (โครงการ pension-v1) | วันที่ออกรายงาน: {new Date().toLocaleDateString('th-TH')}
            </p>
          </div>

          {/* Table */}
          <div className="mt-6">
            <table className="w-full text-left border-collapse border border-slate-400 text-sm">
              <thead>
                <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                  <th className="py-2.5 px-3 border-r border-slate-400 text-center w-12">ลำดับ</th>
                  <th className="py-2.5 px-3 border-r border-slate-400">จังหวัด</th>
                  <th className="py-2.5 px-3 border-r border-slate-400 text-right">จำนวนที่อนุมัติ (ราย)</th>
                  <th className="py-2.5 px-3 text-right w-28">สัดส่วน (%)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {provinceSummary.map((item) => {
                  const pct = totalCountAll > 0 ? ((item.count / totalCountAll) * 100).toFixed(1) : '0.0';
                  return (
                    <tr key={item.province} className="border-b border-slate-300">
                      <td className="py-2.5 px-3 border-r border-slate-300 text-center">{item.no}</td>
                      <td className="py-2.5 px-3 border-r border-slate-300 font-medium">จังหวัด{item.province}</td>
                      <td className="py-2.5 px-3 border-r border-slate-300 text-right font-bold">
                        {item.count.toLocaleString()}
                      </td>
                      <td className="py-2.5 px-3 text-right">{pct}%</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-200 font-bold text-slate-900 border-t-2 border-slate-900">
                  <td colSpan={2} className="py-3 px-3 border-r border-slate-400 text-center">
                    รวมทั้งสิ้น (8 จังหวัด)
                  </td>
                  <td className="py-3 px-3 border-r border-slate-400 text-right text-base">
                    {totalCountAll.toLocaleString()} ราย
                  </td>
                  <td className="py-3 px-3 text-right">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Signatures */}
          <div className="mt-16 grid grid-cols-2 gap-8 text-center text-sm pt-8 border-t border-slate-200">
            <div>
              <p className="mb-14">ลงชื่อ..............................................................</p>
              <p className="font-semibold">(..............................................................)</p>
            </div>
            <div>
              <p className="mb-14">ลงชื่อ..............................................................</p>
              <p className="font-semibold">(..............................................................)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
