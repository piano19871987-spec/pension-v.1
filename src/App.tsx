/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, testConnection, loginWithGoogle, logoutUser } from './firebase';
import { PensionRecord, TARGET_PROVINCES } from './types/pension';
import { subscribePensionRecords, seedSampleData } from './services/pensionService';
import { Navbar } from './components/Navbar';
import { PensionForm } from './components/PensionForm';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { MonthlySummary } from './components/MonthlySummary';
import { YearlySummary } from './components/YearlySummary';
import { RecordsTable } from './components/RecordsTable';
import { PrintReportModal } from './components/PrintReportModal';
import {
  CheckCircle,
  Database,
  Layers,
  Sparkles,
  PlusCircle,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [records, setRecords] = useState<PensionRecord[]>([]);
  const [recordsLoading, setRecordsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('form');

  const [editingRecord, setEditingRecord] = useState<PensionRecord | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isSeeding, setIsSeeding] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // 1. Initialize Auth and Connection test
  useEffect(() => {
    testConnection();

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    return () => unsubscribeAuth();
  }, []);

  // 2. Real-time Firestore subscription (Open access - loads records immediately without login)
  useEffect(() => {
    setRecordsLoading(true);
    const unsubscribeRecords = subscribePensionRecords(
      (data) => {
        setRecords(data);
        setRecordsLoading(false);
      },
      (error) => {
        console.error('Subscription error:', error);
        setRecordsLoading(false);
      }
    );

    return () => {
      unsubscribeRecords();
    };
  }, []);

  // Auth actions
  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      setStatusMessage('เข้าสู่ระบบสำเร็จ ข้อมูลผู้บันทึกจะถูกตั้งค่าอัตโนมัติ');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      console.error('Login error:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setStatusMessage('ออกจากระบบเรียบร้อยแล้ว');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Quick Seed Sample Data (works without login)
  const handleSeedData = async () => {
    setIsSeeding(true);
    try {
      const officer = currentUser?.displayName || 'เจ้าหน้าที่สถิติบำเหน็จบำนาญ';
      const count = await seedSampleData(officer);
      setStatusMessage(`นำเข้าข้อมูลตัวอย่างสำเร็จ ${count} รายการ ครบทั้ง 8 จังหวัด`);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'ไม่สามารถนำเข้าข้อมูลตัวอย่างได้');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleEditRecord = (record: PensionRecord) => {
    setEditingRecord(record);
    setActiveTab('form');
  };

  const handleRecordSaved = () => {
    setEditingRecord(null);
    setActiveTab('records');
  };

  return (
    <div className="min-h-screen bg-slate-100/90 text-slate-800 font-sans flex flex-col">
      {/* Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (editingRecord && tab !== 'form') {
            setEditingRecord(null);
          }
          setActiveTab(tab);
        }}
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        totalRecordsCount={records.length}
        onOpenPrintReport={() => setIsPrintModalOpen(true)}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Floating status alert */}
        {statusMessage && (
          <div className="mb-5 p-4 rounded-xl bg-amber-500 text-slate-950 font-medium text-sm flex items-center justify-between shadow-lg animate-fadeIn border border-amber-400">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              <span>{statusMessage}</span>
            </div>
            <button
              onClick={() => setStatusMessage(null)}
              className="text-xs font-bold px-2 py-1 rounded-md bg-amber-600/30 hover:bg-amber-600/50 cursor-pointer"
            >
              ปิด
            </button>
          </div>
        )}

        {/* Quick Context / Province Strip */}
        <div className="mb-6 bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>เชื่อมต่อฐานข้อมูล Firestore (pension-v1)</span>
            </span>
            <span className="text-slate-400 hidden md:inline">|</span>
            <span className="text-slate-600 hidden md:inline">
              สามารถบันทึกข้อมูลและดูสรุปผลได้ทันที
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-semibold text-slate-700">8 จังหวัด:</span>
            {TARGET_PROVINCES.map((prov) => (
              <span
                key={prov}
                className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium border border-slate-200"
              >
                {prov}
              </span>
            ))}
          </div>
        </div>

        {/* Tab 1: Overview & Analytics Charts */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {records.length === 0 && !recordsLoading && (
              <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center max-w-xl mx-auto my-8">
                <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-4">
                  <Layers className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-slate-900">
                  ยังไม่มีข้อมูลสถิติในระบบ pension-v1
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
                  เริ่มบันทึกข้อมูลสถิติของ 8 จังหวัด (ราชบุรี, กาญจนบุรี, สุพรรณบุรี, นครปฐม, สมุทรสาคร, สมุทรสงคราม, เพชรบุรี, ประจวบคีรีขันธ์) หรือคลิกปุ่มนำเข้าข้อมูลตัวอย่างเพื่อแสดงกราฟวิเคราะห์ได้ทันที
                </p>
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                  <button
                    onClick={() => setActiveTab('form')}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>บันทึกข้อมูลแรก</span>
                  </button>
                  <button
                    onClick={handleSeedData}
                    disabled={isSeeding}
                    className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{isSeeding ? 'กำลังนำเข้า...' : 'นำเข้าชุดข้อมูลตัวอย่าง 8 จังหวัด'}</span>
                  </button>
                </div>
              </div>
            )}

            <AnalyticsCharts records={records} />
          </div>
        )}

        {/* Tab 2: Pension Data Entry Form */}
        {activeTab === 'form' && (
          <PensionForm
            currentUser={currentUser}
            onLogin={handleLogin}
            onRecordSaved={handleRecordSaved}
            editingRecord={editingRecord}
            onCancelEdit={() => {
              setEditingRecord(null);
              setActiveTab('records');
            }}
          />
        )}

        {/* Tab 3: Monthly Summary */}
        {activeTab === 'monthly' && (
          <MonthlySummary records={records} />
        )}

        {/* Tab 4: Yearly Summary */}
        {activeTab === 'yearly' && (
          <YearlySummary records={records} />
        )}

        {/* Tab 5: All Records Table */}
        {activeTab === 'records' && (
          <RecordsTable
            records={records}
            currentUser={currentUser}
            onEditRecord={handleEditRecord}
            onAddNew={() => {
              setEditingRecord(null);
              setActiveTab('form');
            }}
            onRecordDeleted={() => {
              setStatusMessage('ลบข้อมูลสถิติเรียบร้อยแล้ว');
              setTimeout(() => setStatusMessage(null), 3000);
            }}
          />
        )}
      </main>

      {/* Official Print Report Modal */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        records={records}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-1">
          <p className="font-semibold text-slate-700">
            ระบบจัดเก็บข้อมูลสถิติบำเหน็จบำนาญ (Pension Statistics & Analytics System)
          </p>
          <p className="text-slate-400">
            เชื่อมต่อฐานข้อมูล Firebase โครงการ pension-v1 | ขอบเขต 8 จังหวัด: ราชบุรี, กาญจนบุรี, สุพรรณบุรี, นครปฐม, สมุทรสาคร, สมุทรสงคราม, เพชรบุรี, ประจวบคีรีขันธ์
          </p>
        </div>
      </footer>
    </div>
  );
}
