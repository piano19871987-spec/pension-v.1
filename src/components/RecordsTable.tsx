import React, { useState, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  PensionRecord,
  TARGET_PROVINCES,
  THAI_MONTHS,
  PROVINCE_COLORS,
} from '../types/pension';
import { deletePensionRecord } from '../services/pensionService';
import {
  Search,
  Filter,
  Trash2,
  Edit3,
  Download,
  Plus,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';

interface RecordsTableProps {
  records: PensionRecord[];
  currentUser: User | null;
  onEditRecord: (record: PensionRecord) => void;
  onAddNew: () => void;
  onRecordDeleted: () => void;
}

export const RecordsTable: React.FC<RecordsTableProps> = ({
  records,
  onEditRecord,
  onAddNew,
  onRecordDeleted,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvince, setSelectedProvince] = useState<string>('all');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const [sortField, setSortField] = useState<'date' | 'count' | 'province'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Deletion modal state
  const [deletingRecord, setDeletingRecord] = useState<PensionRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Available years from records and default range 2569 - 2576
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
    return records.filter((r) => {
      // Province filter
      if (selectedProvince !== 'all' && r.province !== selectedProvince) {
        return false;
      }
      // Year filter
      if (selectedYear !== 'all' && r.year.toString() !== selectedYear) {
        return false;
      }
      // Month filter
      if (selectedMonth !== 'all' && r.month.toString() !== selectedMonth) {
        return false;
      }
      // Search query (search in recordedBy, province, notes)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inRecordedBy = (r.recordedBy || '').toLowerCase().includes(q);
        const inProvince = (r.province || '').toLowerCase().includes(q);
        const inNotes = (r.notes || '').toLowerCase().includes(q);
        if (!inRecordedBy && !inProvince && !inNotes) {
          return false;
        }
      }
      return true;
    });
  }, [records, selectedProvince, selectedYear, selectedMonth, searchQuery]);

  // Sorted records
  const sortedRecords = useMemo(() => {
    return [...filteredRecords].sort((a, b) => {
      if (sortField === 'count') {
        return sortOrder === 'asc'
          ? a.approvedCount - b.approvedCount
          : b.approvedCount - a.approvedCount;
      }
      if (sortField === 'province') {
        return sortOrder === 'asc'
          ? a.province.localeCompare(b.province, 'th')
          : b.province.localeCompare(a.province, 'th');
      }
      // default: date (year & month)
      const dateA = a.year * 100 + a.month;
      const dateB = b.year * 100 + b.month;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  }, [filteredRecords, sortField, sortOrder]);

  // Paginated records
  const paginatedRecords = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedRecords.slice(start, start + itemsPerPage);
  }, [sortedRecords, currentPage]);

  const totalPages = Math.ceil(sortedRecords.length / itemsPerPage) || 1;

  // Reset filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedProvince('all');
    setSelectedYear('all');
    setSelectedMonth('all');
    setCurrentPage(1);
  };

  // Handle Delete
  const confirmDelete = async () => {
    if (!deletingRecord) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deletePensionRecord(deletingRecord.id);
      setDeletingRecord(null);
      onRecordDeleted();
    } catch (err: any) {
      setDeleteError(err.message || 'ไม่สามารถลบรายการได้');
    } finally {
      setIsDeleting(false);
    }
  };

  // Export filtered CSV
  const handleExportCSV = () => {
    const headers = [
      'รหัสรายการ',
      'จังหวัด',
      'เดือน',
      'ปี พ.ศ.',
      'จำนวนที่อนุมัติ (ราย)',
      'ผู้บันทึก',
      'หมายเหตุ',
      'วันที่บันทึก',
    ];

    const rows = sortedRecords.map((r) => [
      `"${r.id}"`,
      `"${r.province}"`,
      `"${r.monthName}"`,
      r.year,
      r.approvedCount,
      `"${r.recordedBy}"`,
      `"${r.notes || ''}"`,
      `"${r.createdAt}"`,
    ]);

    const csvContent =
      '\uFEFF' +
      [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `รายการสถิติบำเหน็จบำนาญ_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Top Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              รายการข้อมูลสถิติที่บันทึกทั้งหมด
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              แสดงข้อมูลสถิติการอนุมัติบำเหน็จบำนาญในฐานข้อมูล Firestore ({sortedRecords.length} รายการที่ตรงกับเงื่อนไข)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center space-x-1.5 px-3 py-2 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>ส่งออก CSV</span>
            </button>

            <button
              onClick={onAddNew}
              className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-sm transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>บันทึกข้อมูลใหม่</span>
            </button>
          </div>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-2 border-t border-slate-100 text-xs">
          {/* Search box */}
          <div className="md:col-span-2 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="ค้นหาชื่อผู้บันทึก, จังหวัด, หมายเหตุ..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Province Filter (8 Provinces) */}
          <div>
            <select
              value={selectedProvince}
              onChange={(e) => {
                setSelectedProvince(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium cursor-pointer"
            >
              <option value="all">ทุกจังหวัด (8 จังหวัด)</option>
              {TARGET_PROVINCES.map((p) => (
                <option key={p} value={p}>
                  จังหวัด {p}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div>
            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium cursor-pointer"
            >
              <option value="all">ทุกปี พ.ศ.</option>
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  พ.ศ. {yr}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="flex items-center gap-2">
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-2 px-3 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 font-medium cursor-pointer"
            >
              <option value="all">ทุกเดือน (12 เดือน)</option>
              {THAI_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.name}
                </option>
              ))}
            </select>

            {(searchQuery ||
              selectedProvince !== 'all' ||
              selectedYear !== 'all' ||
              selectedMonth !== 'all') && (
              <button
                onClick={handleResetFilters}
                title="ล้างตัวกรองทั้งหมด"
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Records Table View */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-600 uppercase tracking-wider">
                <th
                  onClick={() => {
                    setSortField('province');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-amber-600 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>จังหวัด</span>
                    {sortField === 'province' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </div>
                </th>

                <th
                  onClick={() => {
                    setSortField('date');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-4 cursor-pointer hover:text-amber-600 transition"
                >
                  <div className="flex items-center gap-1">
                    <span>งวดประจำเดือน/ปี</span>
                    {sortField === 'date' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </div>
                </th>

                <th
                  onClick={() => {
                    setSortField('count');
                    setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                  }}
                  className="py-3 px-4 text-right cursor-pointer hover:text-amber-600 transition"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>จำนวนที่อนุมัติ</span>
                    {sortField === 'count' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </div>
                </th>

                <th className="py-3 px-4">ผู้บันทึก</th>
                <th className="py-3 px-4">หมายเหตุ</th>
                <th className="py-3 px-4 text-center w-28">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedRecords.length > 0 ? (
                paginatedRecords.map((r) => {
                  const provColor = PROVINCE_COLORS[r.province] || '#3B82F6';

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-2.5 h-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: provColor }}
                          />
                          <span>{r.province}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700">
                        <span className="font-medium text-slate-900">
                          {r.monthName}
                        </span>{' '}
                        <span className="text-slate-500 text-xs">
                          (พ.ศ. {r.year})
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                        {r.approvedCount.toLocaleString()}{' '}
                        <span className="text-xs font-normal text-slate-500">
                          ราย
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-700">
                        <div className="font-semibold text-slate-900">
                          {r.recordedBy}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-xs text-slate-500 max-w-[200px] truncate">
                        {r.notes || '-'}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => onEditRecord(r)}
                            title="แก้ไขรายการนี้"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setDeletingRecord(r)}
                            title="ลบรายการนี้"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-slate-400 text-sm"
                  >
                    <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-medium text-slate-600">
                      ไม่พบข้อมูลสถิติที่ตรงกับเงื่อนไข
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      ลองปรับเปลี่ยนตัวกรอง หรือกดปุ่ม "บันทึกข้อมูลใหม่" เพื่อเพิ่มข้อมูล
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
            <div>
              แสดงหน้า <span className="font-bold">{currentPage}</span> จากทั้งหมด{' '}
              <span className="font-bold">{totalPages}</span> หน้า
            </div>
            <div className="flex items-center space-x-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                ก่อนหน้า
              </button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded-lg font-semibold transition cursor-pointer ${
                    currentPage === i + 1
                      ? 'bg-amber-500 text-slate-950'
                      : 'hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingRecord && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-bold text-slate-900">
              ยืนยันการลบข้อมูลสถิติ
            </h3>
            <p className="text-sm text-slate-600 mt-2">
              คุณต้องการลบข้อมูลสถิติการอนุมัติของ{' '}
              <span className="font-bold text-slate-800">
                จังหวัด{deletingRecord.province}
              </span>{' '}
              ประจำเดือน{deletingRecord.monthName} พ.ศ. {deletingRecord.year}{' '}
              (จำนวน {deletingRecord.approvedCount} ราย) ใช่หรือไม่?
            </p>
            <p className="text-xs text-red-600 mt-2">
              * ข้อมูลจะถูกลบออกจาก Firebase (pension-v1) อย่างถาวร
            </p>

            {deleteError && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 text-red-700 text-xs">
                {deleteError}
              </div>
            )}

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeletingRecord(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-sm font-medium transition cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-bold shadow-sm transition cursor-pointer"
              >
                {isDeleting ? 'กำลังลบ...' : 'ยืนยันลบข้อมูล'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
