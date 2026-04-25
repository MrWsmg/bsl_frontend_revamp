"use client";

import React, { useState } from 'react';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { SaturdayWeekPicker } from '../../common/SaturdayWeekPicker';
import { toast } from '../../ui/sonner';
import { Eye, FileDown, FileText } from 'lucide-react';

interface SharedWeeklySheetSectionProps {
  userRole?: string;
}

const GM_MD_ROLES = ['general_manager', 'managing_director'];

export const SharedWeeklySheetSection: React.FC<SharedWeeklySheetSectionProps> = ({ userRole }) => {
  const [farms, setFarms] = useState<{ id: number; name: string }[]>([]);
  const [farmsLoaded, setFarmsLoaded] = useState(false);
  const [farmId, setFarmId] = useState<number | ''>('');
  const [weekStart, setWeekStart] = useState('');
  const [sheetData, setSheetData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<'pdf' | 'csv' | null>(null);

  // GM and MD access all farms; others use the payroll-scoped endpoint
  React.useEffect(() => {
    const fetchFarms = userRole && GM_MD_ROLES.includes(userRole)
      ? apiService.getFarms()
      : apiService.getPayrollFarms();
    fetchFarms
      .then((data) => {
        setFarms(
          (data as any[])
            .map((f) => ({ id: f.id ?? f.farm_id, name: f.name }))
            .filter((f) => f.id != null)
        );
        setFarmsLoaded(true);
      })
      .catch(() => setFarmsLoaded(true));
  }, [userRole]);

  const validate = () => {
    if (!farmId) { toast.error('Please select a farm'); return false; }
    if (!weekStart) { toast.error('Please select a week start (Saturday)'); return false; }
    return true;
  };

  const handleView = async () => {
    if (!validate()) return;
    setLoading(true);
    setSheetData(null);
    try {
      const data = await apiService.getWeeklyPayrollSheet(Number(farmId), weekStart);
      setSheetData(data);
    } catch (err: any) {
      if (err?.status === 400 || err?.message?.includes('400')) {
        toast.error('Week start must be a Saturday');
      } else {
        toast.error(err.message || 'Failed to load weekly sheet');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (type: 'pdf' | 'csv') => {
    if (!validate()) return;
    setDownloading(type);
    try {
      if (type === 'pdf') {
        await apiService.downloadWeeklyPayrollSheetPdf(Number(farmId), weekStart);
      } else {
        await apiService.downloadWeeklyPayrollSheetCsv(Number(farmId), weekStart);
      }
      toast.success(`${type.toUpperCase()} downloaded`);
    } catch (err: any) {
      toast.error(err.message || `Failed to download ${type.toUpperCase()}`);
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Weekly Payroll Sheet</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Farm */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
            <select
              value={farmId === '' ? '' : String(farmId)}
              onChange={(e) => setFarmId(e.target.value ? Number(e.target.value) : '')}
              disabled={!farmsLoaded}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">{farmsLoaded ? 'Select farm…' : 'Loading…'}</option>
              {farms.map((f) => <option key={String(f.id)} value={String(f.id)}>{f.name}</option>)}
            </select>
          </div>

          {/* Saturday week picker */}
          <SaturdayWeekPicker value={weekStart} onChange={setWeekStart} />

          {/* View button */}
          <div className="flex items-end">
            <button
              onClick={handleView}
              disabled={loading || !farmId || !weekStart}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 w-full justify-center"
            >
              {loading ? <LoadingSpinner size="sm" /> : <Eye className="w-4 h-4" />}
              {loading ? 'Loading…' : 'View Sheet'}
            </button>
          </div>
        </div>

        {/* Download buttons */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => handleDownload('pdf')}
            disabled={!farmId || !weekStart || downloading === 'pdf'}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            {downloading === 'pdf' ? <LoadingSpinner size="sm" /> : <FileDown className="w-4 h-4" />}
            Download PDF
          </button>
          <button
            onClick={() => handleDownload('csv')}
            disabled={!farmId || !weekStart || downloading === 'csv'}
            className="flex items-center gap-2 px-4 py-2 border border-green-300 text-green-700 text-sm rounded-lg hover:bg-green-50 disabled:opacity-50"
          >
            {downloading === 'csv' ? <LoadingSpinner size="sm" /> : <FileDown className="w-4 h-4" />}
            Download CSV
          </button>
        </div>

        {/* Sheet preview */}
        {sheetData && (() => {
          const DAY_LABELS = ['Sat', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
          const workers: any[] = sheetData.workers ?? [];

          return (
            <div className="space-y-3">
              {/* Meta */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-1">
                <span><span className="font-medium">Farm:</span> {sheetData.farm_name}</span>
                <span><span className="font-medium">Week:</span> {sheetData.week_start} → {sheetData.week_end}</span>
                {sheetData.grand_total != null && (
                  <span className="ml-auto font-semibold text-gray-900">
                    Grand Total: TZS {Number(sheetData.grand_total).toLocaleString()}
                  </span>
                )}
              </div>

              <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-10">Worker</th>
                      {DAY_LABELS.map((d) => (
                        <th key={d} className="px-3 py-2 text-center font-medium text-gray-500 uppercase min-w-[90px]">{d}</th>
                      ))}
                      <th className="px-3 py-2 text-right font-medium text-gray-500 uppercase">Week Total</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {workers.map((w: any, i: number) => {
                      const daySlots: any[] = Array.isArray(w.days) ? w.days : [];
                      return (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium text-gray-900 sticky left-0 bg-white whitespace-nowrap">{w.name}</td>
                          {DAY_LABELS.map((_, di) => {
                            const slot = daySlots[di];
                            if (!slot) return <td key={di} className="px-3 py-2 text-center text-gray-300">—</td>;
                            return (
                              <td key={di} className="px-3 py-2 text-center text-gray-700">
                                <div className="font-medium">{slot.task_code}</div>
                                {slot.block && <div className="text-gray-400">{slot.block}</div>}
                                <div className="text-gray-500">{slot.quantity} u</div>
                                <div className="text-green-700 font-medium">{Number(slot.total_amount ?? 0).toLocaleString()}</div>
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-right font-semibold text-gray-900 whitespace-nowrap">
                            {Number(w.week_total ?? w.total ?? 0).toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                    {sheetData.grand_total != null && (
                      <tr className="bg-gray-100 font-bold">
                        <td className="px-3 py-2 sticky left-0 bg-gray-100">Grand Total</td>
                        {DAY_LABELS.map((_, di) => <td key={di} />)}
                        <td className="px-3 py-2 text-right text-gray-900">
                          {Number(sheetData.grand_total).toLocaleString()}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
