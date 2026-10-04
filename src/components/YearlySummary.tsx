import React, { useState, useMemo } from 'react';
import {
  PensionRecord,
  TARGET_PROVINCES,
  THAI_MONTHS,
  PROVINCE_COLORS,
} from '../types/pension';
import {
  TrendingUp,
  Download,
  Award,
  Layers,
  Calendar,
} from 'lucide-react';

interface YearlySummaryProps {
  records: PensionRecord[];
}

export const YearlySummary: React.FC<YearlySummaryProps> = ({ records }) => {
  const currentBeYear = new Date().getFullYear() + 543;

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

  // Filter records for selected year
  const yearRecords = useMemo(() => {
    return records.filter((r) => r.year === selectedYear);
  }, [records, selectedYear]);

  // Previous year for YoY comparison
  const prevYearRecords = useMemo(() => {
    return records.filter((r) => r.year === selectedYear - 1);
  }, [records, selectedYear]);

  // Matrix of Province (rows) x Month (columns) - 8 Provinces
  const matrixData = useMemo(() => {
    return TARGET_PROVINCES.map((prov) => {
      const monthCounts: Record<number, number> = {};
      let totalCount = 0;

      THAI_MONTHS.forEach((m) => {
        const found = yearRecords.find(
          (r) => r.province === prov && r.month === m.value
        );
        const count = found ? found.approvedCount : 0;
        monthCounts[m.value] = count;
        totalCount += count;
      });

      return {
        province: prov,
        monthCounts,
        totalCount,
        color: PROVINCE_COLORS[prov] || '#3B82F6',
      };
    });
  }, [yearRecords]);

  // Column totals (sum of each month across all 8 provinces)
  const monthTotals = useMemo(() => {
    return THAI_MONTHS.map((m) => {
      const sum = matrixData.reduce(
        (acc, row) => acc + (row.monthCounts[m.value] || 0),
        0
      );
      return { month: m.value, name: m.name, short: m.short, sum };
    });
  }, [matrixData]);

  // Grand total for the year
  const grandTotalCount = useMemo(() => {
    return matrixData.reduce((acc, row) => acc + row.totalCount, 0);
  }, [matrixData]);

  // Previous year grand total
  const prevYearTotalCount = useMemo(() => {
    return prevYearRecords.reduce((acc, r) => acc + (r.approvedCount || 0), 0);
  }, [prevYearRecords]);

  // YoY growth percentage
  const yoyGrowth = useMemo(() => {
    if (prevYearTotalCount === 0) return null;
    const diff = grandTotalCount - prevYearTotalCount;
    const pct = ((diff / prevYearTotalCount) * 100).toFixed(1);
    return { diff, pct, isPositive: diff >= 0 };
  }, [grandTotalCount, prevYearTotalCount]);

  // Top province of the year
  const topProvince = useMemo(() => {
    return [...matrixData].sort((a, b) => b.totalCount - a.totalCount)[0];
  }, [matrixData]);

  // Peak month of the year
  const peakMonth = useMemo(() => {
    return [...monthTotals].sort((a, b) => b.sum - a.sum)[0];
  }, [monthTotals]);

  // Export full year matrix as CSV
  const handleExportCSV = () => {
    const headers = [
      'จังหวัด',
      ...THAI_MONTHS.map((m) => m.name),
      'ยอดรวมทั้งปี (ราย)',
    ];

    const rows = matrixData.map((row) => [
      `"${row.province}"`,
      ...THAI_MONTHS.map((m) => row.monthCounts[m.value] || 0),
      row.totalCount,
    ]);

    // Footer row
    const footer = [
      '"รวมทั้งสิ้น"',
      ...monthTotals.map((m) => m.sum),
      grandTotalCount,
    ];

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(',')), footer.join(',')].join(
        '\n'
      );

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `รายงานสรุปสถิติบำเหน็จบำนาญรายปี_${selectedYear}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-900 text-xs font-semibold mb-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600" />
            <span>รายงานสรุปผลรอบประจำปี</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
            สรุปผลสถิติบำเหน็จบำนาญ ประจำปี พ.ศ. {selectedYear}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            ตารางเปรียบเทียบสถิติการอนุมัติ 12 เดือน ครอบคลุม 8 จังหวัด (ราชบุรี, กาญจนบุรี, สุพรรณบุรี, นครปฐม, สมุทรสาคร, สมุทรสงคราม, เพชรบุรี, ประจวบคีรีขันธ์)
          </p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center space-x-2 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-xs font-semibold text-slate-600">ประจำปี:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="text-xs font-bold bg-transparent text-slate-900 focus:outline-none cursor-pointer"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  พ.ศ. {yr}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-sm transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>ส่งออกตารางสรุป</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total annual approvals */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>ยอดอนุมัติรวมตลอดทั้งปี</span>
            <Layers className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {grandTotalCount.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500">ราย</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            {yoyGrowth ? (
              <span
                className={`font-semibold ${
                  yoyGrowth.isPositive ? 'text-emerald-600' : 'text-rose-600'
                }`}
              >
                {yoyGrowth.isPositive ? '+' : ''}
                {yoyGrowth.pct}% เทียบปี พ.ศ. {selectedYear - 1}
              </span>
            ) : (
              <span>ทั้ง 12 เดือน 8 จังหวัด</span>
            )}
          </div>
        </div>

        {/* Top province */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>จังหวัดยอดอนุมัติสูงสุด</span>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-amber-700">
              {topProvince?.totalCount > 0 ? topProvince.province : '-'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            {topProvince?.totalCount > 0 ? (
              <span>
                {topProvince.totalCount.toLocaleString()} ราย (
                {(
                  (topProvince.totalCount / (grandTotalCount || 1)) *
                  100
                ).toFixed(1)}
                %)
              </span>
            ) : (
              <span>ยังไม่มีข้อมูล</span>
            )}
          </div>
        </div>

        {/* Peak month */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>เดือนที่มีการอนุมัติสูงสุด</span>
            <Calendar className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-blue-700">
              {peakMonth?.sum > 0 ? peakMonth.name : '-'}
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-600">
            {peakMonth?.sum > 0 ? (
              <span>รวม {peakMonth.sum.toLocaleString()} ราย</span>
            ) : (
              <span>ยังไม่มีข้อมูล</span>
            )}
          </div>
        </div>

        {/* Average per province */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>ค่าเฉลี่ยต่อจังหวัดทั้งปี</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {Math.round(grandTotalCount / TARGET_PROVINCES.length).toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500">ราย</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            เฉลี่ยจาก 8 จังหวัด
          </div>
        </div>
      </div>

      {/* Cross-tab Matrix Table (8 Provinces x 12 Months) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              ตารางเมทริกซ์สถิติบำเหน็จบำนาญ (8 จังหวัด x 12 เดือน) ประจำปี พ.ศ. {selectedYear}
            </h3>
            <p className="text-xs text-slate-500">
              แสดงสถิติจำนวนเรื่องที่อนุมัติในแต่ละเดือนครบทุกจังหวัด
            </p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-medium self-start sm:self-auto">
            หน่วย: ราย
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-center border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-3 text-left w-36 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">
                  จังหวัด
                </th>
                {THAI_MONTHS.map((m) => (
                  <th key={m.value} className="py-3 px-2 min-w-[56px]">
                    {m.short}
                  </th>
                ))}
                <th className="py-3 px-3 bg-amber-50 text-amber-900 font-extrabold border-l border-amber-200 min-w-[120px]">
                  รวมทั้งปี (ราย)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {matrixData.map((row) => (
                <tr key={row.province} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-3 text-left font-semibold text-slate-800 sticky left-0 bg-white z-10 border-r border-slate-200 flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: row.color }}
                    />
                    <span>{row.province}</span>
                  </td>

                  {THAI_MONTHS.map((m) => {
                    const count = row.monthCounts[m.value] || 0;
                    return (
                      <td
                        key={m.value}
                        className={`py-3 px-2 ${
                          count > 0
                            ? 'font-medium text-slate-900'
                            : 'text-slate-300'
                        }`}
                      >
                        {count > 0 ? count.toLocaleString() : '-'}
                      </td>
                    );
                  })}

                  <td className="py-3 px-3 font-extrabold text-amber-900 bg-amber-50/60 border-l border-amber-200 text-sm">
                    {row.totalCount.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-900 text-white font-bold text-xs">
                <td className="py-3 px-3 text-left sticky left-0 bg-slate-900 z-10 border-r border-slate-800 text-amber-300">
                  รวมทุกจังหวัด
                </td>
                {monthTotals.map((m) => (
                  <td key={m.month} className="py-3 px-2 text-slate-200">
                    {m.sum > 0 ? m.sum.toLocaleString() : '-'}
                  </td>
                ))}
                <td className="py-3 px-3 bg-amber-500 text-slate-950 font-black border-l border-amber-600 text-sm">
                  {grandTotalCount.toLocaleString()} ราย
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
