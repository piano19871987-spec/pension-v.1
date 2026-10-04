import React, { useState, useMemo } from 'react';
import {
  PensionRecord,
  TARGET_PROVINCES,
  THAI_MONTHS,
  PROVINCE_COLORS,
} from '../types/pension';
import {
  BarChart2,
  TrendingUp,
  PieChart,
  Award,
  Layers,
  Calendar,
  Filter,
} from 'lucide-react';

interface AnalyticsChartsProps {
  records: PensionRecord[];
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ records }) => {
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

  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    month: number;
    value: number;
    monthName: string;
  } | null>(null);

  // Filter records for selected year
  const yearRecords = useMemo(() => {
    return records.filter((r) => r.year === selectedYear);
  }, [records, selectedYear]);

  // Aggregate by Province for selected year
  const provinceStats = useMemo(() => {
    const stats: Record<string, { count: number }> = {};
    TARGET_PROVINCES.forEach((p) => {
      stats[p] = { count: 0 };
    });

    yearRecords.forEach((r) => {
      if (stats[r.province]) {
        stats[r.province].count += r.approvedCount || 0;
      }
    });

    return TARGET_PROVINCES.map((province) => ({
      province,
      count: stats[province].count,
      color: PROVINCE_COLORS[province] || '#64748B',
    }));
  }, [yearRecords]);

  // Total summary for selected year
  const totalApprovedCount = useMemo(() => {
    return provinceStats.reduce((sum, item) => sum + item.count, 0);
  }, [provinceStats]);

  // Sorted province ranking
  const sortedProvinces = useMemo(() => {
    return [...provinceStats].sort((a, b) => b.count - a.count);
  }, [provinceStats]);

  // Monthly breakdown for selected year (1-12)
  const monthlyData = useMemo(() => {
    return THAI_MONTHS.map((m) => {
      const monthRecs = yearRecords.filter((r) => r.month === m.value);
      const count = monthRecs.reduce((sum, r) => sum + (r.approvedCount || 0), 0);
      return {
        month: m.value,
        name: m.name,
        short: m.short,
        count,
      };
    });
  }, [yearRecords]);

  // Calculations for Bar Chart
  const maxValBar = useMemo(() => {
    const vals = provinceStats.map((p) => p.count);
    return Math.max(...vals, 1);
  }, [provinceStats]);

  // Calculations for Trend Chart
  const maxValTrend = useMemo(() => {
    const vals = monthlyData.map((m) => m.count);
    return Math.max(...vals, 1);
  }, [monthlyData]);

  const formatValue = (val: number) => {
    return `${val.toLocaleString()} ราย`;
  };

  return (
    <div className="space-y-6">
      {/* Top Filter */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
            <Filter className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              ภาพรวมและกราฟวิเคราะห์ข้อมูลสถิติ 8 จังหวัด
            </h3>
            <p className="text-xs text-slate-500">
              วิเคราะห์เปรียบเทียบสถิติการอนุมัติบำเหน็จบำนาญในแต่ละจังหวัดและแนวโน้มรายเดือน
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          {/* Year selector */}
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
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: ยอดรวม */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              ยอดอนุมัติรวม 8 จังหวัด (ปี พ.ศ. {selectedYear})
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {totalApprovedCount.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500">ราย</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 flex items-center gap-1">
            <span>ครอบคลุมทั้ง 8 จังหวัดเป้าหมาย</span>
          </div>
        </div>

        {/* KPI 2: จังหวัดอนุมัติสูงสุด */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              จังหวัดที่อนุมัติสูงสุด
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-emerald-700">
              {sortedProvinces[0]?.count > 0 ? sortedProvinces[0].province : '-'}
            </span>
            {sortedProvinces[0]?.count > 0 && (
              <span className="text-xs font-semibold text-slate-500">
                (อันดับ 1)
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-600">
            ยอดรวม:{' '}
            <span className="font-bold text-slate-800">
              {formatValue(sortedProvinces[0]?.count || 0)}
            </span>
          </div>
        </div>

        {/* KPI 3: ค่าเฉลี่ยต่อจังหวัด */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              ค่าเฉลี่ยต่อจังหวัด
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {Math.round(totalApprovedCount / TARGET_PROVINCES.length).toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-slate-500">ราย/จังหวัด</span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            จากทั้งหมด {TARGET_PROVINCES.length} จังหวัด
          </div>
        </div>

        {/* KPI 4: จำนวนรายการที่บันทึก */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              รอบข้อมูลที่บันทึกแล้ว
            </span>
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900">
              {yearRecords.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              ชุดข้อมูล
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500">
            บันทึกลงใน Firestore (pension-v1)
          </div>
        </div>
      </div>

      {/* Main Charts Grid: Chart 1 (Bar) & Chart 2 (Monthly Trend) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Bar Chart comparing 8 provinces */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                  <BarChart2 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    เปรียบเทียบสถิติการอนุมัติ 8 จังหวัด
                  </h4>
                  <p className="text-xs text-slate-500">
                    ประจำปี พ.ศ. {selectedYear} (จำนวนที่อนุมัติเป็นราย)
                  </p>
                </div>
              </div>
            </div>

            {/* Custom Interactive SVG / HTML Bar Chart */}
            <div className="mt-4 space-y-2.5">
              {provinceStats.map((item, index) => {
                const percentOfMax = maxValBar > 0 ? (item.count / maxValBar) * 100 : 0;
                const percentOfTotal =
                  totalApprovedCount > 0
                    ? ((item.count / totalApprovedCount) * 100).toFixed(1)
                    : '0';

                const isHovered = hoveredBarIndex === index;

                return (
                  <div
                    key={item.province}
                    onMouseEnter={() => setHoveredBarIndex(index)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    className={`p-2 rounded-xl transition cursor-default ${
                      isHovered ? 'bg-slate-50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <div className="flex items-center gap-2 font-semibold text-slate-800">
                        <span
                          className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                          style={{ backgroundColor: item.color }}
                        />
                        <span>{item.province}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-slate-900 text-sm">
                          {formatValue(item.count)}
                        </span>
                        <span className="ml-2 text-slate-400 font-medium text-[11px]">
                          ({percentOfTotal}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar Container */}
                    <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${Math.max(percentOfMax, item.count > 0 ? 3 : 0)}%`,
                          backgroundColor: item.color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>แสดงตามสัดส่วนของจังหวัดที่อนุมัติสูงสุด</span>
            <span className="font-medium text-amber-600">
              รวม 8 จังหวัด
            </span>
          </div>
        </div>

        {/* Chart 2: Monthly Trend (12 Months Line / Area Chart) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    แนวโน้มการอนุมัติรายเดือน (12 เดือน)
                  </h4>
                  <p className="text-xs text-slate-500">
                    ความเคลื่อนไหวตั้งแต่เดือน ม.ค. ถึง ธ.ค. พ.ศ. {selectedYear}
                  </p>
                </div>
              </div>
            </div>

            {/* Interactive SVG Trend Area Chart */}
            <div className="mt-4">
              <div className="h-56 relative w-full flex items-end">
                <svg
                  viewBox="0 0 550 200"
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10B981" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#10B981" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Grid lines */}
                  {[0.25, 0.5, 0.75, 1].map((ratio) => (
                    <line
                      key={ratio}
                      x1="0"
                      y1={200 - ratio * 180}
                      x2="550"
                      y2={200 - ratio * 180}
                      stroke="#E2E8F0"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                  ))}

                  {/* Generate Area and Path */}
                  {(() => {
                    const points = monthlyData.map((d, i) => {
                      const val = d.count;
                      const x = (i / (monthlyData.length - 1)) * 550;
                      const y = 190 - (maxValTrend > 0 ? (val / maxValTrend) * 160 : 0);
                      return { x, y, data: d, val };
                    });

                    const pathString = points
                      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                      .join(' ');

                    const areaString = `${pathString} L 550 200 L 0 200 Z`;

                    return (
                      <>
                        <path d={areaString} fill="url(#trendGradient)" />
                        <path
                          d={pathString}
                          fill="none"
                          stroke="#10B981"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Interactive Points */}
                        {points.map((p) => (
                          <g key={p.data.month} className="group cursor-pointer">
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r={p.val > 0 ? 5 : 3}
                              fill="#FFFFFF"
                              stroke="#10B981"
                              strokeWidth="3"
                              className="transition-transform group-hover:scale-150"
                              onMouseEnter={() =>
                                setHoveredPoint({
                                  month: p.data.month,
                                  value: p.val,
                                  monthName: p.data.name,
                                })
                              }
                              onMouseLeave={() => setHoveredPoint(null)}
                            />
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>

                {/* Hover Tooltip */}
                {hoveredPoint && (
                  <div className="absolute top-2 right-4 bg-slate-900 text-white px-3 py-1.5 rounded-lg shadow-lg text-xs pointer-events-none border border-slate-700">
                    <span className="font-semibold text-emerald-400">
                      {hoveredPoint.monthName}:
                    </span>{' '}
                    <span>{formatValue(hoveredPoint.value)}</span>
                  </div>
                )}
              </div>

              {/* Month X-axis labels */}
              <div className="grid grid-cols-12 text-[10px] sm:text-xs text-slate-500 font-medium text-center mt-3 pt-2 border-t border-slate-100">
                {monthlyData.map((d) => (
                  <span
                    key={d.month}
                    className={`truncate ${
                      d.count > 0 ? 'text-slate-800 font-semibold' : 'text-slate-400'
                    }`}
                  >
                    {d.short}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-400 flex items-center justify-between">
            <span>แตะหรือชี้ที่จุดกราฟเพื่อดูรายละเอียดยอดแต่ละเดือน</span>
            <span className="font-medium text-emerald-600">
              ภาพรวมตลอดทั้งปี
            </span>
          </div>
        </div>
      </div>

      {/* Chart 3 & 4: Donut Proportion & Provincial Ranking Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Donut Proportion */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">
                  สัดส่วนการอนุมัติตามจังหวัด
                </h4>
                <p className="text-xs text-slate-500">
                  การกระจายตัวของทั้ง 8 จังหวัด
                </p>
              </div>
            </div>

            {/* SVG Donut Visual */}
            <div className="flex items-center justify-center py-3">
              <div className="relative w-44 h-44">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                  {(() => {
                    const total = totalApprovedCount;
                    if (total === 0) {
                      return (
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke="#E2E8F0"
                          strokeWidth="18"
                        />
                      );
                    }

                    let accumulatedPercent = 0;
                    return provinceStats.map((prov) => {
                      const val = prov.count;
                      const percent = val / total;
                      const strokeDasharray = `${percent * 251.2} ${251.2}`;
                      const strokeDashoffset = -(accumulatedPercent * 251.2);
                      accumulatedPercent += percent;

                      return (
                        <circle
                          key={prov.province}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke={prov.color}
                          strokeWidth="18"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-300 hover:opacity-80"
                        />
                      );
                    });
                  })()}
                </svg>

                {/* Center Label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                  <span className="text-[11px] text-slate-400 font-medium">รวมทั้งสิ้น</span>
                  <span className="text-lg font-extrabold text-slate-900">
                    {totalApprovedCount.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">ราย</span>
                </div>
              </div>
            </div>

            {/* Province Color legend */}
            <div className="grid grid-cols-2 gap-2 text-xs pt-2">
              {provinceStats.map((prov) => {
                const total = totalApprovedCount;
                const pct = total > 0 ? ((prov.count / total) * 100).toFixed(1) : '0';

                return (
                  <div key={prov.province} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: prov.color }}
                    />
                    <span className="text-slate-700 truncate">{prov.province}</span>
                    <span className="text-slate-400 text-[10px] ml-auto">
                      {pct}%
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Provincial Ranking Leaderboard (2 columns wide) */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm lg:col-span-2 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-600">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-base">
                    ตารางจัดอันดับสถิติการอนุมัติรายจังหวัด (พ.ศ. {selectedYear})
                  </h4>
                  <p className="text-xs text-slate-500">
                    เรียงตามลำดับยอดการอนุมัติจากมากไปน้อย (ทั้ง 8 จังหวัด)
                  </p>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-3">อันดับ</th>
                    <th className="py-2.5 px-3">จังหวัด</th>
                    <th className="py-2.5 px-3 text-right">จำนวนที่อนุมัติ</th>
                    <th className="py-2.5 px-3 text-right">สัดส่วน</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {sortedProvinces.map((prov, idx) => {
                    const pct =
                      totalApprovedCount > 0
                        ? ((prov.count / totalApprovedCount) * 100).toFixed(1)
                        : '0.0';

                    return (
                      <tr key={prov.province} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 font-semibold">
                          <span
                            className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                              idx === 0
                                ? 'bg-amber-100 text-amber-800'
                                : idx === 1
                                ? 'bg-slate-200 text-slate-700'
                                : idx === 2
                                ? 'bg-amber-900/10 text-amber-900'
                                : 'text-slate-500'
                            }`}
                          >
                            {idx + 1}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-medium text-slate-800 flex items-center gap-2">
                          <span
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: prov.color }}
                          />
                          <span>{prov.province}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                          {prov.count.toLocaleString()} <span className="text-xs font-normal text-slate-500">ราย</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                            {pct}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>ฐานข้อมูล Firestore สถิติปี พ.ศ. {selectedYear}</span>
            <span className="font-semibold text-slate-800">
              รวม 8 จังหวัด: {totalApprovedCount.toLocaleString()} ราย
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
