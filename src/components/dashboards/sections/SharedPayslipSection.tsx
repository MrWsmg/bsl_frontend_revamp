"use client";

import React, { useState } from 'react';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { toast } from '../../ui/sonner';
import { FileDown, Receipt } from 'lucide-react';

interface SharedPayslipSectionProps {
  userRole?: string;
}

const GM_MD_ROLES = ['general_manager', 'managing_director'];

export const SharedPayslipSection: React.FC<SharedPayslipSectionProps> = ({ userRole }) => {
  const [farms, setFarms] = useState<{ id: number; name: string }[]>([]);
  const [farmsLoaded, setFarmsLoaded] = useState(false);
  const [workers, setWorkers] = useState<{ id: number; name: string }[]>([]);
  const [farmId, setFarmId] = useState<number | ''>('');
  const [workerName, setWorkerName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [downloading, setDownloading] = useState(false);

  React.useEffect(() => {
    const fetchFarms = userRole && GM_MD_ROLES.includes(userRole)
      ? apiService.getFarms()
      : apiService.getPayrollFarms();
    Promise.all([
      fetchFarms.catch(() => []),
      apiService.getWorkers().catch(() => []),
    ]).then(([f, w]) => {
      setFarms(
        (f as any[])
          .map((farm) => ({ id: farm.id ?? farm.farm_id, name: farm.name }))
          .filter((farm) => farm.id != null)
      );
      setWorkers(w as any[]);
      setFarmsLoaded(true);
    });
  }, [userRole]);

  const validate = () => {
    if (!farmId)     { toast.error('Please select a farm');       return false; }
    if (!workerName.trim()) { toast.error('Please enter a worker name'); return false; }
    if (!startDate)  { toast.error('Please select a start date'); return false; }
    if (!endDate)    { toast.error('Please select an end date');  return false; }
    if (startDate > endDate) { toast.error('Start date must be before end date'); return false; }
    return true;
  };

  const handleDownload = async () => {
    if (!validate()) return;
    setDownloading(true);
    try {
      await apiService.downloadPayslipPdf({ worker_name: workerName.trim(), farm_id: Number(farmId), start_date: startDate, end_date: endDate });
      toast.success('Payslip downloaded');
    } catch (err: any) {
      if (err?.status === 404 || err?.message?.includes('404')) {
        toast.error('No approved records found for this worker in this period');
      } else if (err?.status === 403 || err?.message?.includes('403')) {
        toast.error("You don't have access to this farm");
      } else {
        toast.error(err.message || 'Failed to download payslip');
      }
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Receipt className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Individual Payslip</h2>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 max-w-2xl">
        <p className="text-sm text-gray-500 mb-6">
          Download a payslip PDF for a specific worker over a date range. Only fully-approved records are included.
        </p>

        <div className="space-y-4">
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
              {farms.map((f) => <option key={f.id} value={String(f.id)}>{f.name}</option>)}
            </select>
          </div>

          {/* Worker */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Worker Name</label>
            <input
              list="payslip-worker-list"
              value={workerName}
              onChange={(e) => setWorkerName(e.target.value)}
              placeholder="Type or select worker…"
              className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <datalist id="payslip-worker-list">
              {workers.map((w) => <option key={w.id} value={w.name} />)}
            </datalist>
          </div>

          {/* Date range */}
          <div className="grid grid-cols-2 gap-4">
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
          </div>

          <div className="pt-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {downloading ? <LoadingSpinner size="sm" /> : <FileDown className="w-4 h-4" />}
              {downloading ? 'Generating…' : 'Download Payslip PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
