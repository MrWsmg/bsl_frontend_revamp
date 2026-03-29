"use client";

// Payment Summary Document — worker rows with payment method details, subtotals by method, PDF download
import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { FileText, Search } from 'lucide-react';
import { toast } from '../../ui/sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function triggerBlobDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash: 'Cash',
  bank_transfer: 'Bank Transfer',
  mobile_money: 'Mobile Money',
};

export const PaymentSummaryDocSection: React.FC = () => {
  const [selectedFarm, setSelectedFarm] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [summaryData, setSummaryData] = useState<any>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const getFarms = useCallback(() => apiService.getPayrollFarms(), []);
  const { data: farms, loading: farmsLoading } = useApi(getFarms);

  const validate = (): boolean => {
    if (!selectedFarm) { toast.error('Please select a farm'); return false; }
    if (!startDate) { toast.error('Please select a start date'); return false; }
    if (!endDate) { toast.error('Please select an end date'); return false; }
    if (startDate > endDate) { toast.error('Start date must be before end date'); return false; }
    return true;
  };

  const getParams = () => ({
    farm_id: parseInt(selectedFarm),
    start_date: startDate,
    end_date: endDate,
  });

  const handlePreview = async () => {
    if (!validate()) return;
    setLoadingPreview(true);
    setSummaryData(null);
    try {
      const data = await apiService.getPaymentSummary(getParams());
      setSummaryData(data);
    } catch (err: any) {
      toast.error(err.message || 'Failed to load payment summary');
    } finally {
      setLoadingPreview(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!validate()) return;
    setDownloadingPdf(true);
    try {
      const blob = await apiService.downloadPaymentSummaryPdf(getParams());
      triggerBlobDownload(blob, `payment-summary-${startDate}-to-${endDate}.pdf`);
      toast.success('PDF downloaded');
    } catch (err: any) {
      toast.error(err.message || 'Failed to download PDF');
    } finally {
      setDownloadingPdf(false);
    }
  };

  // Compute subtotals per payment method
  const subtotals: Record<string, number> = {};
  let grandTotal = 0;
  if (summaryData?.workers) {
    for (const w of summaryData.workers) {
      const method = w.payment_method || 'cash';
      subtotals[method] = (subtotals[method] || 0) + (w.total || 0);
      grandTotal += w.total || 0;
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Summary</CardTitle>
          <CardDescription>Worker payment breakdown with bank/mobile details for the selected period</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Farm *</Label>
              <Select value={selectedFarm} onValueChange={setSelectedFarm}>
                <SelectTrigger>
                  <SelectValue placeholder={farmsLoading ? 'Loading…' : 'Select farm'} />
                </SelectTrigger>
                <SelectContent>
                  {farms?.filter((f: any) => f.id != null).map((f: any) => (
                    <SelectItem key={f.id} value={f.id.toString()}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button onClick={handlePreview} disabled={loadingPreview}>
              {loadingPreview ? <LoadingSpinner size="sm" /> : <Search className="w-4 h-4 mr-2" />}
              Preview
            </Button>
            <Button variant="outline" onClick={handleDownloadPdf} disabled={downloadingPdf}>
              {downloadingPdf ? <LoadingSpinner size="sm" /> : <FileText className="w-4 h-4 mr-2" />}
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary table */}
      {summaryData && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Summary — {new Date(startDate + 'T00:00:00').toLocaleDateString()} to {new Date(endDate + 'T00:00:00').toLocaleDateString()}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Worker</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Type</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Tasks</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Days</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Total (TZS)</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Payment Method</th>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Payment Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {(summaryData.workers || []).map((w: any, i: number) => {
                    const method = w.payment_method || 'cash';
                    let details = '—';
                    if (method === 'bank_transfer') {
                      details = [w.bank_name, w.bank_account_number].filter(Boolean).join(' / ') || '—';
                    } else if (method === 'mobile_money') {
                      details = [w.mobile_money_provider, w.mobile_money_number].filter(Boolean).join(' / ') || '—';
                    }
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2 font-medium">{w.worker_name}</td>
                        <td className="px-4 py-2 text-gray-500 capitalize">{w.worker_type || '—'}</td>
                        <td className="px-4 py-2 text-right text-gray-700">{w.tasks ?? '—'}</td>
                        <td className="px-4 py-2 text-right text-gray-700">{w.days ?? '—'}</td>
                        <td className="px-4 py-2 text-right font-semibold">{(w.total || 0).toLocaleString()}</td>
                        <td className="px-4 py-2 text-gray-700">{PAYMENT_METHOD_LABELS[method] || method}</td>
                        <td className="px-4 py-2 text-gray-500">{details}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Subtotals by method */}
            {Object.keys(subtotals).length > 0 && (
              <div className="mt-6 space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">Subtotals by Payment Method</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {Object.entries(subtotals).map(([method, amount]) => (
                    <div key={method} className="bg-gray-50 rounded p-3 border">
                      <p className="text-xs text-gray-500">{PAYMENT_METHOD_LABELS[method] || method}</p>
                      <p className="text-lg font-bold mt-1">TZS {amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
                <div className="bg-blue-50 rounded p-3 border border-blue-200 mt-3">
                  <p className="text-xs text-blue-600 font-medium">Grand Total</p>
                  <p className="text-xl font-bold text-blue-800 mt-1">TZS {grandTotal.toLocaleString()}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
