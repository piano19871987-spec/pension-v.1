import React from 'react';
import { User } from 'firebase/auth';
import {
  BarChart3,
  PlusCircle,
  Calendar,
  TrendingUp,
  FileSpreadsheet,
  LogIn,
  LogOut,
  Building2,
  Printer,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser: User | null;
  onLogin: () => void;
  onLogout: () => void;
  totalRecordsCount: number;
  onOpenPrintReport: () => void;
  onSeedData: () => void;
  isSeeding: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  onLogin,
  onLogout,
  totalRecordsCount,
  onOpenPrintReport,
  onSeedData,
  isSeeding,
}) => {
  return (
    <header className="bg-slate-900 text-white shadow-xl sticky top-0 z-40 border-b border-slate-800">
      {/* Top Banner / Identity */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-3 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 p-0.5 shadow-md flex items-center justify-center">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center text-amber-400">
                <Building2 className="w-6 h-6" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-lg sm:text-xl tracking-tight text-white flex items-center gap-2">
                  ระบบจัดเก็บข้อมูลสถิติบำเหน็จบำนาญ
                </h1>
                <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Firebase: pension-v1
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                ระบบสรุปผลรายเดือน รายปี และวิเคราะห์สถิติการอนุมัติ 8 จังหวัด (ราชบุรี กาญจนบุรี สุพรรณบุรี นครปฐม สมุทรสาคร สมุทรสงคราม เพชรบุรี ประจวบคีรีขันธ์)
              </p>
            </div>
          </div>

          {/* User info & Auth */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {totalRecordsCount === 0 && (
              <button
                onClick={onSeedData}
                disabled={isSeeding}
                title="นำเข้าข้อมูลตัวอย่าง 8 จังหวัด เพื่อทดลองวิเคราะห์กราฟ"
                className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition shadow-sm cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isSeeding ? 'กำลังนำเข้า...' : 'นำเข้าข้อมูลตัวอย่าง (8 จังหวัด)'}</span>
              </button>
            )}

            <button
              onClick={onOpenPrintReport}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition cursor-pointer"
              title="พิมพ์รายงานสรุปราชการ"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden sm:inline">พิมพ์รายงาน</span>
            </button>

            {currentUser ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-white leading-tight">
                    {currentUser.displayName || 'เจ้าหน้าที่ผู้บันทึก'}
                  </div>
                  <div className="text-[11px] text-slate-400 truncate max-w-[140px]">
                    {currentUser.email}
                  </div>
                </div>
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-8 h-8 rounded-full border border-amber-400/50 shadow-sm"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-900 font-bold flex items-center justify-center text-xs">
                    {(currentUser.displayName || 'U')[0]}
                  </div>
                )}
                <button
                  onClick={onLogout}
                  title="ออกจากระบบ"
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onLogin}
                title="เข้าสู่ระบบ Google เพื่อดึงชื่อและรูปโปรไฟล์ผู้บันทึกอัตโนมัติ (ไม่บังคับ)"
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium transition cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">เข้าสู่ระบบ Google (ถ้ามี)</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 overflow-x-auto py-2 text-sm no-scrollbar">
          <button
            onClick={() => setActiveTab('form')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'form'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>บันทึกข้อมูลสถิติ</span>
          </button>

          <button
            onClick={() => setActiveTab('overview')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>ภาพรวม & กราฟวิเคราะห์</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'monthly'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>สรุปผลรายเดือน</span>
          </button>

          <button
            onClick={() => setActiveTab('yearly')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'yearly'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>สรุปผลรายปี</span>
          </button>

          <button
            onClick={() => setActiveTab('records')}
            className={`flex items-center space-x-2 px-3 py-2 rounded-lg font-medium whitespace-nowrap transition cursor-pointer ${
              activeTab === 'records'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-bold'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>รายการข้อมูลทั้งหมด</span>
            {totalRecordsCount > 0 && (
              <span
                className={`ml-1.5 px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                  activeTab === 'records'
                    ? 'bg-slate-950 text-white'
                    : 'bg-slate-800 text-slate-300'
                }`}
              >
                {totalRecordsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
