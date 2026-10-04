import React, { useState, useMemo } from 'react';
import {
  PensionRecord,
  TARGET_PROVINCES,
  THAI_MONTHS,
  PROVINCE_COLORS,
} from '../types/pension';
import {
  Calendar,
  Layers,
  Award,
  Download,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';

interface MonthlySummaryProps {
  records: PensionRecord[];
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({ records }) => {
  const currentBeYear = new Date().getFullYear() + 543;
  const currentMonthNum = new Date().getMonth() + 1;

  // Available years from records and default range 2569 - 2576
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    for (let y = 2569; y <= 2576; y++) {
      yearsSet.add(y);
    }
    records.forEach((r) => yearsSet.add(r.year));
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [records]);

  const [selectedYear, setSelectedYear] = useState<number>(2569);

  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    return currentMonthNum;
  });

  // Filter records for selected month & year
  const currentMonthRecords = useMemo(() => {
    return records.filter(
      (r) => r.year === selectedYear && r.month === selectedMonth
    );
  }, [records, selectedYear, selectedMonth]);

  // Previous month data for MoM comparison
  const prevMonthInfo = useMemo(() => {
    let pYear = selectedYear;
    let pMonth = selectedMonth - 1;
    if (pMonth < 1) {
      pMonth = 12;
      pYear = selectedYear - 1;
    }
    const prevRecs = records.filter(
      (r) => r.year === pYear && r.month === pMonth
    );
    const prevCount = prevRecs.reduce((sum, r) => sum + (r.approvedCount || 0), 0);
    return { year: pYear, month: pMonth, totalCount: prevCount };
  }, [records, selectedYear, selectedMonth]);

  // Province-level mapping for the selected month (8 provinces)
  const provinceDetails = useMemo(() => {
    return TARGET_PROVINCES.map((prov) => {
      const match = currentMonthRecords.find((r) => r.province === prov);
      return {
        province: prov,
        approvedCount: match ? match.approvedCount : 0,
        recordedBy: match ? match.recordedBy : '-',
        notes: match ? match.notes : '',
        recordId: match ? match.id : null,
        updatedAt: match ? match.updatedAt : null,
        isRecorded: !!match,
        color: PROVINCE_COLORS[prov] || '#3B82F6',
      };
    });
  }, [currentMonthRecords]);

  // Total for current month
  const totalMonthApproved = useMemo(() => {
    return provinceDetails.reduce((sum, p) => sum + p.approvedCount, 0);
  }, [provinceDetails]);

  const recordedCountiesCount = useMemo(() => {
    return provinceDetails.filter((p) => p.isRecorded).length;
  }, [provinceDetails]);

  // Month-over-Month change
  const momChange = useMemo(() => {
    if (prevMonthInfo.totalCount === 0) return null;
    const diff = totalMonthApproved - prevMonthInfo.totalCount;
    const pct = ((diff / prevMonthInfo.totalCount) * 100).toFixed(1);
    return { diff, pct, isPositive: diff >= 0 };
  }, [totalMonthApproved, prevMonthInfo]);

  // Max province count for visual bars
  const maxApprovedInMonth = useMemo(() => {
    const counts = provinceDetails.map((p) => p.approvedCount);
    return Math.max(...counts, 1);
  }, [provinceDetails]);

  const monthName = THAI_MONTHS.find((m) => m.value === selectedMonth)?.name;

  // Export CSV for this month
  const handleExportCSV = () => {
    const headers = [
      'ลำดับ',
      'จังหวัด',
      'ประจำเดือน',
      'ปี พ.ศ.',
      'จำนวนที่อนุมัติ (ราย)',
      'ผู้บันทึก',
      'หมายเหตุ',
    ];

    const rows = provinceDetails.map((item, index) => [
      index + 1,
      `"${item.province}"`,
      `"${monthName}"`,
      selectedYear,
      item.approvedCount,
      `"${item.recordedBy}"`,
      `"${item.notes || ''}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `รายงานสถิติบำเหน็จบำนาญ_${monthName}_${selectedYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Month & Year Select Header */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-semibold mb-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span>รายงานสรุปผลรอบประจำเดือน</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            สรุปสถิติการอนุมัติ ประจำเดือน{monthName} พ.ศ. {selectedYear}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            รายงานสถิติบำเหน็จบำนาญทั้ง 8 จังหวัด (ราชบุรี, กาญจนบุรี, สุพรรณบุรี, นครปฐม, สมุทรสาคร, สมุทรสงคราม, เพชรบุรี, ประจวบคีรีขันธ์)
          </p>
        </div>

        {/* Filter selectors & Export */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
            <span className="text-xs font-semibold text-slate-600">เดือน:</span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="text-xs font-bold bg-transparent text-slate-900 focus:outline-none cursor-pointer"
            >
              {THAI_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
            <span className="text-xs font-semibold text-slate-600">ปี พ.ศ.:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold bg-transparent text-slate-900 focus:outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>ส่งออก CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards for Monthly View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: ยอดรวมอนุมัติประจำเดือน */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>ยอดอนุมัติรวมประจำเดือน</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {totalMonthApproved.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500">ราย</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
            {momChange ? (
              <span
                className={`inline-flex items-center text-xs font-bold ${
                  momChange.isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {momChange.isPositive ? (
                  <ArrowUpRight className="w-3.5 h-3.5" />
                ) : (
                  <ArrowDownRight className="w-3.5 h-3.5" />
                )}
                {Math.abs(Number(momChange.pct))}% เทียบเดือนก่อนหน้า
              </span>
            ) : (
              <span>เดือน{monthName} พ.ศ. {selectedYear}</span>
            )}
          </div>
        </div>

        {/* KPI 2: อนุมัติสูงสุดในเดือนนี้ */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>อนุมัติสูงสุดในเดือนนี้</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          {(() => {
            const sorted = [...provinceDetails].sort(
              (a, b) => b.approvedCount - a.approvedCount
            );
            const top = sorted[0];
            return (
              <>
                <div className="mt-2.5 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-amber-700">
                    {top?.approvedCount > 0 ? top.province : '-'}
                  </span>
                </div>
                <div className="mt-2 text-xs text-slate-600">
                  {top?.approvedCount > 0 ? (
                    <span>จำนวน {top.approvedCount.toLocaleString()} ราย</span>
                  ) : (
                    <span>ยังไม่มีข้อมูล</span>
                  )}
                </div>
              </>
            );
          })()}
        </div>

        {/* KPI 3: ความครบถ้วนของการบันทึก */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>ความครบถ้วนของการบันทึก</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {recordedCountiesCount} / 8
            </span>
            <span className="text-xs font-semibold text-slate-500">จังหวัด</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {recordedCountiesCount === 8 ? (
              <span className="text-emerald-600 font-medium">บันทึกครบถ้วนทั้ง 8 จังหวัดแล้ว</span>
            ) : (
              <span className="text-amber-600 font-medium">
                ยังขาดอีก {8 - recordedCountiesCount} จังหวัด
              </span>
            )}
          </div>
        </div>

        {/* KPI 4: ค่าเฉลี่ยต่อจังหวัด */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>ค่าเฉลี่ยต่อจังหวัดในเดือนนี้</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {Math.round(totalMonthApproved / 8).toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500">ราย</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            เฉลี่ยจาก 8 จังหวัด
          </div>
        </div>
      </div>

      {/* Breakdown Table & Visual Comparison */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              ตารางสรุปสถิติบำเหน็จบำนาญแยกตามจังหวัด ประจำเดือน{monthName} พ.ศ. {selectedYear}
            </h3>
            <p className="text-xs text-slate-500">
              แสดงจำนวนที่อนุมัติ แผนภูมิสัดส่วน และเจ้าหน้าที่ผู้บันทึกข้อมูล (ทั้ง 8 จังหวัด)
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-4">จังหวัด</th>
                <th className="py-3 px-4 text-right">จำนวนที่อนุมัติ (ราย)</th>
                <th className="py-3 px-4 w-48">แผนภูมิเปรียบเทียบ</th>
                <th className="py-3 px-4">ผู้บันทึกข้อมูล</th>
                <th className="py-3 px-4">สถานะการบันทึก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {provinceDetails.map((item) => {
                const percentOfMax =
                  maxApprovedInMonth > 0
                    ? (item.approvedCount / maxApprovedInMonth) * 100
                    : 0;

                return (
                  <tr key={item.province} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-800 flex items-center gap-2">
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: item.color }}
                      />
                      <span>{item.province}</span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                      {item.approvedCount.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-500">ราย</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${percentOfMax}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 text-xs">
                      {item.recordedBy !== '-' ? (
                        <div className="font-medium text-slate-800">
                          {item.recordedBy}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">ยังไม่ได้บันทึก</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {item.isRecorded ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>บันทึกแล้ว</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          <Clock className="w-3 h-3" />
                          <span>รอดำเนินการ</span>
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold text-sm">
                <td className="py-3.5 px-4">รวมทั้งสิ้น (8 จังหวัด)</td>
                <td className="py-3.5 px-4 text-right text-amber-300 text-base">
                  {totalMonthApproved.toLocaleString()} ราย
                </td>
                <td className="py-3.5 px-4 text-xs text-slate-400" colSpan={3}>
                  บันทึกแล้ว {recordedCountiesCount} จาก 8 จังหวัด | ประจำงวดเดือน{monthName} พ.ศ. {selectedYear}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
