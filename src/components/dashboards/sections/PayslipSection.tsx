"use client";

// Payslip Section — farm selector, worker search, date range, PDF download
import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { FileText } from 'lucide-react';
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

export const PayslipSection: React.FC = () => {
  const [selectedFarm, setSelectedFarm] = useState<string>('');
  const [workerName, setWorkerName] = useState<string>('');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [downloading, setDownloading] = useState(false);

  const getFarms = useCallback(() => apiService.getPayrollFarms(), []);
  const getWorkers = useCallback(() => apiService.getWorkers(), []);

  const { data: farms, loading: farmsLoading } = useApi(getFarms);
  const { data: workers } = useApi(getWorkers);

  // When a worker is selected from the dropdown, populate the name field
  const handleWorkerSelect = (workerId: string) => {
    setSelectedWorkerId(workerId);
    const worker = workers?.find((w: any) => w.id.toString() === workerId);
    if (worker) setWorkerName(worker.full_name ?? '');
  };

  const validate = (): boolean => {
    if (!selectedFarm) { toast.error('Please select a farm'); return false; }
    if (!workerName.trim()) { toast.error('Please enter or select a worker'); return false; }
    if (!startDate) { toast.error('Please select a start date'); return false; }
    if (!endDate) { toast.error('Please select an end date'); return false; }
    if (startDate > endDate) { toast.error('Start date must be before end date'); return false; }
    return true;
  };

  const handleDownload = async () => {
    if (!validate()) return;
    setDownloading(true);
    try {
      const blob = await apiService.downloadPayslipPdf({
        worker_name: workerName.trim(),
        farm_id: parseInt(selectedFarm),
        start_date: startDate,
        end_date: endDate,
      });
      const safeWorker = workerName.trim().replace(/\s+/g, '-').toLowerCase();
      triggerBlobDownload(blob, `payslip-${safeWorker}-${startDate}-to-${endDate}.pdf`);
      toast.success('Payslip downloaded');
    } catch (err: any) {
      const status = err.response?.status;
      if (status === 404) {
        toast.error('No approved records found for this worker in this period');
      } else if (status === 403) {
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
      <Card>
        <CardHeader>
          <CardTitle>Individual Payslip</CardTitle>
          <CardDescription>Generate a PDF payslip for a single worker over a date range</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Farm */}
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

            {/* Worker — searchable dropdown + manual text fallback */}
            <div className="space-y-2">
              <Label>Worker *</Label>
              <Select value={selectedWorkerId} onValueChange={handleWorkerSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select worker" />
                </SelectTrigger>
                <SelectContent>
                  {workers?.filter((w: any) => w.id != null).map((w: any) => (
                    <SelectItem key={w.id} value={w.id.toString()}>{w.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Allow manual override (e.g. for workers not yet in the list) */}
              <Input
                value={workerName}
                onChange={(e) => { setWorkerName(e.target.value); setSelectedWorkerId(''); }}
                placeholder="Or type worker name directly"
                className="text-sm"
              />
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>End Date *</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>

          <div className="pt-2">
            <Button onClick={handleDownload} disabled={downloading}>
              {downloading ? <LoadingSpinner size="sm" /> : <FileText className="w-4 h-4 mr-2" />}
              Download Payslip PDF
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
