"use client";

import React, { useState, useCallback } from 'react';
import { Eye, Globe, Download } from 'lucide-react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export const ReportsSection: React.FC = () => {
  const [dailyReport, setDailyReport]   = useState<any>(null);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [monthlyReport, setMonthlyReport] = useState<any>(null);
  const [systemReport, setSystemReport]   = useState<any>(null);
  const [loading, setLoading]             = useState(false);

  const [dailyFilters, setDailyFilters] = useState({
    date:    new Date().toISOString().split('T')[0],
    farm_id: '',
  });
  const [weeklyFilters, setWeeklyFilters] = useState({
    week_start: '',
    farm_id:    '',
  });
  const [monthlyFilters, setMonthlyFilters] = useState({
    farm_id: '',
    year:    String(new Date().getFullYear()),
    month:   String(new Date().getMonth() + 1),
  });

  const getFarms = useCallback(() => apiService.farms.getFarms(), []);
  const { data: farms } = useApi(getFarms);
  const farmList = Array.isArray(farms) ? farms : [];

  // ── Daily ──────────────────────────────────────────────────────────────────
  const generateDailyReport = async () => {
    try {
      setLoading(true);
      const data = await apiService.reports.getDailyReport(
        dailyFilters.date,
        dailyFilters.farm_id ? parseInt(dailyFilters.farm_id) : undefined,
      );
      setDailyReport(data);
    } catch {
      toast.error('Failed to generate daily report.');
    } finally { setLoading(false); }
  };

  const downloadDaily = async (format: 'excel' | 'pdf') => {
    try {
      if (format === 'excel') {
        await apiService.reports.downloadDailyReportExcel(
          dailyFilters.date,
          dailyFilters.farm_id ? parseInt(dailyFilters.farm_id) : undefined,
        );
      } else {
        await apiService.reports.downloadDailyReportPDF(
          dailyFilters.date,
          dailyFilters.farm_id ? parseInt(dailyFilters.farm_id) : undefined,
        );
      }
    } catch { toast.error(`Failed to download ${format.toUpperCase()} report.`); }
  };

  // ── Weekly ─────────────────────────────────────────────────────────────────
  const generateWeeklyReport = async () => {
    if (!weeklyFilters.week_start) { toast.error('Select a week start date.'); return; }
    try {
      setLoading(true);
      const data = await apiService.reports.getWeeklyReport(
        weeklyFilters.week_start,
        weeklyFilters.farm_id ? parseInt(weeklyFilters.farm_id) : undefined,
      );
      setWeeklyReport(data);
    } catch {
      toast.error('Failed to generate weekly report.');
    } finally { setLoading(false); }
  };

  const downloadWeekly = async (format: 'excel' | 'pdf') => {
    if (!weeklyFilters.week_start) { toast.error('Select a week start date.'); return; }
    try {
      if (format === 'excel') {
        await apiService.reports.downloadWeeklyReportExcel(
          weeklyFilters.week_start,
          weeklyFilters.farm_id ? parseInt(weeklyFilters.farm_id) : undefined,
        );
      } else {
        await apiService.reports.downloadWeeklyReportPDF(
          weeklyFilters.week_start,
          weeklyFilters.farm_id ? parseInt(weeklyFilters.farm_id) : undefined,
        );
      }
    } catch { toast.error(`Failed to download ${format.toUpperCase()} report.`); }
  };

  // ── Monthly ────────────────────────────────────────────────────────────────
  const generateMonthlyReport = async () => {
    if (!monthlyFilters.farm_id) { toast.error('Select a farm.'); return; }
    try {
      setLoading(true);
      const data = await apiService.getMonthlyReport(
        parseInt(monthlyFilters.farm_id),
        parseInt(monthlyFilters.year),
        parseInt(monthlyFilters.month),
      );
      setMonthlyReport(data);
    } catch {
      toast.error('Failed to generate monthly report.');
    } finally { setLoading(false); }
  };

  // ── System-wide ────────────────────────────────────────────────────────────
  const generateSystemReport = async () => {
    try {
      setLoading(true);
      const data = await apiService.getSystemWideReport();
      setSystemReport(data);
    } catch {
      toast.error('Failed to generate system-wide report.');
    } finally { setLoading(false); }
  };

  const MONTHS = [
    'January','February','March','April','May','June',
    'July','August','September','October','November','December',
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => String(currentYear - i));

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:border-blue-500';
  const btnBlue  = 'w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-md flex items-center justify-center text-sm gap-2';
  const btnGreen = 'w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-md flex items-center justify-center text-sm gap-2';

  return (
    <div className="space-y-6 p-6">

      {/* ── Daily ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-800">Daily Report</h3>
          <p className="text-xs text-gray-500 mt-0.5">Activity totals for a single day</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input type="date" value={dailyFilters.date}
                onChange={e => setDailyFilters(p => ({ ...p, date: e.target.value }))}
                max={new Date().toISOString().split('T')[0]} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm (optional)</label>
              <Select value={dailyFilters.farm_id ? String(dailyFilters.farm_id) : '__all__'}
                onValueChange={(val) => setDailyFilters(p => ({ ...p, farm_id: val === '__all__' ? '' : val }))}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="All Farms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Farms</SelectItem>
                  {farmList.map((f: any) => <SelectItem key={f.id ?? f.farm_id} value={String(f.id ?? f.farm_id)}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <button onClick={generateDailyReport} disabled={loading} className={btnBlue}>
                {loading ? <><LoadingSpinner size="sm" /> Generating…</> : 'Generate'}
              </button>
            </div>
          </div>

          {dailyReport && (
            <div className="mt-4 space-y-4">
              <div className="flex gap-2 justify-end">
                <button onClick={() => window.print()} className="flex items-center gap-1.5 text-xs border border-gray-300 px-3 py-1.5 rounded hover:bg-gray-50">
                  <Eye className="w-3.5 h-3.5" /> Print
                </button>
                <button onClick={() => downloadDaily('excel')} className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700">
                  <Download className="w-3.5 h-3.5" /> Excel
                </button>
                <button onClick={() => downloadDaily('pdf')} className="flex items-center gap-1.5 text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700">
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: 'Payroll',        value: dailyReport.summary?.total_payroll,        count: dailyReport.summary?.payroll_count,        color: 'blue'   },
                  { label: 'Stock Payments', value: dailyReport.summary?.total_stock_payments,  count: dailyReport.summary?.stock_count,           color: 'green'  },
                  { label: 'Expenses',       value: dailyReport.summary?.total_expenses,        count: dailyReport.summary?.expense_count,         color: 'red'    },
                  { label: 'Grand Total',    value: dailyReport.summary?.grand_total,           count: null,                                       color: 'purple' },
                ].map(s => (
                  <div key={s.label} className={`bg-${s.color}-50 rounded-lg p-4`}>
                    <p className={`text-xs font-semibold text-${s.color}-700 mb-1`}>{s.label}</p>
                    <p className={`text-xl font-bold text-${s.color}-800`}>{Number(s.value ?? 0).toLocaleString()}</p>
                    {s.count != null && <p className={`text-xs text-${s.color}-600 mt-0.5`}>{s.count} records</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Weekly ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-800">Weekly Report</h3>
          <p className="text-xs text-gray-500 mt-0.5">Totals across a 7-day window</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week Start Date</label>
              <input type="date" value={weeklyFilters.week_start}
                onChange={e => setWeeklyFilters(p => ({ ...p, week_start: e.target.value }))}
                max={new Date().toISOString().split('T')[0]} className={inputCls} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm (optional)</label>
              <Select value={weeklyFilters.farm_id ? String(weeklyFilters.farm_id) : '__all__'}
                onValueChange={(val) => setWeeklyFilters(p => ({ ...p, farm_id: val === '__all__' ? '' : val }))}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="All Farms" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All Farms</SelectItem>
                  {farmList.map((f: any) => <SelectItem key={f.id ?? f.farm_id} value={String(f.id ?? f.farm_id)}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <button onClick={generateWeeklyReport} disabled={loading} className={btnGreen}>
                {loading ? <><LoadingSpinner size="sm" /> Generating…</> : 'Generate'}
              </button>
            </div>
          </div>

          {weeklyReport && (
            <div className="mt-4 flex gap-2 justify-end">
              <button onClick={() => downloadWeekly('excel')} className="flex items-center gap-1.5 text-xs bg-emerald-600 text-white px-3 py-1.5 rounded hover:bg-emerald-700">
                <Download className="w-3.5 h-3.5" /> Excel
              </button>
              <button onClick={() => downloadWeekly('pdf')} className="flex items-center gap-1.5 text-xs bg-red-600 text-white px-3 py-1.5 rounded hover:bg-red-700">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              <p className="text-xs text-green-700 self-center">Report ready — download above</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Monthly ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-800">Monthly Report</h3>
          <p className="text-xs text-gray-500 mt-0.5">Full month breakdown per farm</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm *</label>
              <Select value={monthlyFilters.farm_id}
                onValueChange={(val) => setMonthlyFilters(p => ({ ...p, farm_id: val }))}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Select farm…" /></SelectTrigger>
                <SelectContent>
                  {farmList.map((f: any) => <SelectItem key={f.id ?? f.farm_id} value={String(f.id ?? f.farm_id)}>{f.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <Select value={monthlyFilters.year}
                onValueChange={(val) => setMonthlyFilters(p => ({ ...p, year: val }))}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Year" /></SelectTrigger>
                <SelectContent>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Month</label>
              <Select value={monthlyFilters.month}
                onValueChange={(val) => setMonthlyFilters(p => ({ ...p, month: val }))}>
                <SelectTrigger className={inputCls}><SelectValue placeholder="Month" /></SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m, i) => <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <button onClick={generateMonthlyReport} disabled={loading} className={btnBlue}>
                {loading ? <><LoadingSpinner size="sm" /> Generating…</> : 'Generate'}
              </button>
            </div>
          </div>

          {monthlyReport && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Monthly Summary</p>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-64">
                {JSON.stringify(monthlyReport, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* ── System-wide ── */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Globe className="w-4 h-4 text-gray-500" /> System-wide Report
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Aggregated totals across all farms</p>
        </div>
        <div className="p-6">
          <button onClick={generateSystemReport} disabled={loading}
            className="bg-gray-800 hover:bg-gray-900 disabled:opacity-50 text-white px-5 py-2 rounded-md flex items-center gap-2 text-sm">
            {loading ? <><LoadingSpinner size="sm" /> Generating…</> : <><Globe className="w-3.5 h-3.5" /> Generate System Report</>}
          </button>

          {systemReport && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">System Summary</p>
              <pre className="text-xs text-gray-700 whitespace-pre-wrap overflow-auto max-h-64">
                {JSON.stringify(systemReport, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
