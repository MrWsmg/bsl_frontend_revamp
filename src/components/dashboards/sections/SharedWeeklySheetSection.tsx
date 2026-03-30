"use client";

import React, { useState } from 'react';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { SaturdayWeekPicker } from '../../common/SaturdayWeekPicker';
import { toast } from '../../ui/sonner';
import { Eye, FileDown, FileText } from 'lucide-react';

export const SharedWeeklySheetSection: React.FC = () => {
  const [farms, setFarms] = useState<{ id: number; name: string }[]>([]);
  const [farmsLoaded, setFarmsLoaded] = useState(false);
  const [farmId, setFarmId] = useState<number | ''>('');
  const [weekStart, setWeekStart] = useState('');
  const [sheetData, setSheetData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState<'pdf' | 'csv' | null>(null);

  // Lazy-load farms on first render
  React.useEffect(() => {
    apiService.getPayrollFarms()
      .then((data) => { setFarms(data as any[]); setFarmsLoaded(true); })
      .catch(() => setFarmsLoaded(true));
  }, []);

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
              value={farmId}
              onChange={(e) => setFarmId(e.target.value ? Number(e.target.value) : '')}
              disabled={!farmsLoaded}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">{farmsLoaded ? 'Select farm…' : 'Loading…'}</option>
              {farms.map((f) => <option key={String(f.id)} value={f.id}>{f.name}</option>)}
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
        {sheetData && (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Worker', 'Type', 'Tasks', 'Days', 'Total (TZS)', 'Payment Method'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(sheetData.workers ?? []).map((w: any, i: number) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">{w.name}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{w.type}</td>
                    <td className="px-4 py-3 text-gray-700">{w.tasks}</td>
                    <td className="px-4 py-3 text-gray-700">{w.days}</td>
                    <td className="px-4 py-3 text-gray-900 font-medium">{Number(w.total ?? 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-gray-600 capitalize">{(w.payment_method ?? '').replace('_', ' ')}</td>
                  </tr>
                ))}
                {sheetData.grand_total != null && (
                  <tr className="bg-gray-100 font-bold">
                    <td colSpan={4} className="px-4 py-3 text-gray-900">Grand Total</td>
                    <td className="px-4 py-3 text-gray-900">{Number(sheetData.grand_total).toLocaleString()}</td>
                    <td />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
