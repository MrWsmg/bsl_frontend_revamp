"use client";

import React, { useState } from 'react';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { toast } from '../../ui/sonner';
import { Eye, FileDown, BarChart2 } from 'lucide-react';

export const SharedPaymentSummarySection: React.FC = () => {
  const [farms, setFarms] = useState<{ id: number; name: string }[]>([]);
  const [farmsLoaded, setFarmsLoaded] = useState(false);
  const [farmId, setFarmId] = useState<number | ''>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  React.useEffect(() => {
    apiService.getPayrollFarms()
      .then((data) => { setFarms(data as any[]); setFarmsLoaded(true); })
      .catch(() => setFarmsLoaded(true));
  }, []);

  const validate = () => {
    if (!farmId)    { toast.error('Please select a farm');       return false; }
    if (!startDate) { toast.error('Please select a start date'); return false; }
    if (!endDate)   { toast.error('Please select an end date');  return false; }
    if (startDate > endDate) { toast.error('Start date must be before end date'); return false; }
    return true;
  };

  const handlePreview = async () => {
    if (!validate()) return;
    setLoading(true);
    setSummaryData(null);
    try {
      const data = await apiService.getPaymentSummaryJson(Number(farmId), startDate, endDate);
      setSummaryData(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load payment summary');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!validate()) return;
    setDownloading(true);
    try {
      await apiService.downloadPaymentSummaryPdf(Number(farmId), startDate, endDate);
      toast.success('PDF downloaded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to download PDF');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Payment Summary</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
            <select
              value={farmId}
              onChange={(e) => setFarmId(e.target.value ? Number(e.target.value) : '')}
              disabled={!farmsLoaded}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
            >
              <option value="">{farmsLoaded ? 'Select farm…' : 'Loading…'}</option>
              {farms.map((f) => { const fid = f.id ?? f.farm_id; return <option key={fid} value={fid}>{f.name}</option>; })}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date" value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date" value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={handlePreview}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 w-full justify-center"
            >
              {loading ? <LoadingSpinner size="sm" /> : <Eye className="w-4 h-4" />}
              {loading ? 'Loading…' : 'Preview'}
            </button>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={handleDownloadPdf}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 border border-red-300 text-red-700 text-sm rounded-lg hover:bg-red-50 disabled:opacity-50"
          >
            {downloading ? <LoadingSpinner size="sm" /> : <FileDown className="w-4 h-4" />}
            Download PDF
          </button>
        </div>

        {summaryData && (
          <div className="space-y-6">
            {/* Summary totals */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Total Workers',  value: summaryData.total_workers ?? summaryData.workers?.length ?? 0 },
                { label: 'Total Records',  value: summaryData.total_records ?? 0 },
                { label: 'Grand Total',    value: `TZS ${Number(summaryData.grand_total ?? 0).toLocaleString()}` },
              ].map((s) => (
                <div key={s.label} className="bg-gray-50 rounded-lg p-4">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{s.value}</p>
                </div>
              ))}
            </div>

            {/* Worker table */}
            <div className="overflow-x-auto border rounded-lg">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Worker', 'Type', 'Tasks', 'Days', 'Total (TZS)', 'Payment Method', 'Bank / Mobile'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(summaryData.workers ?? []).map((w: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{w.name ?? w.worker_name}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{w.type ?? w.worker_type}</td>
                      <td className="px-4 py-3 text-gray-700">{w.tasks ?? w.total_tasks ?? 0}</td>
                      <td className="px-4 py-3 text-gray-700">{w.days ?? w.total_days ?? 0}</td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{Number(w.total ?? w.total_amount ?? 0).toLocaleString()}</td>
                      <td className="px-4 py-3 text-gray-600 capitalize">{(w.payment_method ?? '').replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {w.bank_name ? `${w.bank_name} ${w.bank_account_number ?? ''}` : w.mobile_money_number ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Subtotals by method */}
            {summaryData.subtotals && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(summaryData.subtotals).map(([method, amount]) => (
                  <div key={method} className="border rounded-lg p-4">
                    <p className="text-xs text-gray-500 uppercase tracking-wide capitalize">{method.replace('_', ' ')}</p>
                    <p className="text-lg font-bold text-gray-900 mt-1">TZS {Number(amount).toLocaleString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
