"use client";

// Worker Payment Details — payment method radio with conditional bank/mobile fields
import React, { useEffect, useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Save } from 'lucide-react';
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

type PaymentMethod = 'cash' | 'bank_transfer' | 'mobile_money';

interface PaymentDetailsForm {
  payment_method: PaymentMethod;
  bank_name: string;
  bank_account_number: string;
  mobile_money_provider: string;
  mobile_money_number: string;
}

interface WorkerPaymentDetailsSectionProps {
  workerId: number;
  workerName?: string;
}

const EMPTY_FORM: PaymentDetailsForm = {
  payment_method: 'cash',
  bank_name: '',
  bank_account_number: '',
  mobile_money_provider: '',
  mobile_money_number: '',
};

export const WorkerPaymentDetailsSection: React.FC<WorkerPaymentDetailsSectionProps> = ({ workerId, workerName }) => {
  const [form, setForm] = useState<PaymentDetailsForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const getDetails = useCallback(() => apiService.getWorkerPaymentDetails(workerId), [workerId]);
  const { data, loading } = useApi(getDetails);

  // Populate form when API data arrives
  useEffect(() => {
    if (data) {
      setForm({
        payment_method: data.payment_method || 'cash',
        bank_name: data.bank_name || '',
        bank_account_number: data.bank_account_number || '',
        mobile_money_provider: data.mobile_money_provider || '',
        mobile_money_number: data.mobile_money_number || '',
      });
    }
  }, [data]);

  const handleMethodChange = (method: PaymentMethod) => {
    // Null out irrelevant fields when switching method
    setForm({
      payment_method: method,
      bank_name: method === 'bank_transfer' ? form.bank_name : '',
      bank_account_number: method === 'bank_transfer' ? form.bank_account_number : '',
      mobile_money_provider: method === 'mobile_money' ? form.mobile_money_provider : '',
      mobile_money_number: method === 'mobile_money' ? form.mobile_money_number : '',
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        payment_method: form.payment_method,
        bank_name: form.payment_method === 'bank_transfer' ? form.bank_name || null : null,
        bank_account_number: form.payment_method === 'bank_transfer' ? form.bank_account_number || null : null,
        mobile_money_provider: form.payment_method === 'mobile_money' ? form.mobile_money_provider || null : null,
        mobile_money_number: form.payment_method === 'mobile_money' ? form.mobile_money_number || null : null,
      };
      await apiService.updateWorkerPaymentDetails(workerId, payload);
      toast.success('Payment details saved');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save payment details');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Details{workerName ? ` — ${workerName}` : ''}</CardTitle>
        <CardDescription>Set how this worker receives their payment</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 max-w-md">
        {/* Payment Method */}
        <div className="space-y-3">
          <Label className="text-sm font-medium">Payment Method</Label>
          <div className="flex flex-col gap-2">
            {(['cash', 'bank_transfer', 'mobile_money'] as PaymentMethod[]).map((method) => (
              <label key={method} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="payment_method"
                  value={method}
                  checked={form.payment_method === method}
                  onChange={() => handleMethodChange(method)}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm capitalize">{method.replace('_', ' ')}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Bank Transfer fields */}
        {form.payment_method === 'bank_transfer' && (
          <div className="space-y-3 pl-4 border-l-2 border-blue-200">
            <div className="space-y-2">
              <Label>Bank Name</Label>
              <Input
                value={form.bank_name}
                onChange={(e) => setForm({ ...form, bank_name: e.target.value })}
                placeholder="e.g. CRDB, NMB, ABSA"
              />
            </div>
            <div className="space-y-2">
              <Label>Account Number</Label>
              <Input
                value={form.bank_account_number}
                onChange={(e) => setForm({ ...form, bank_account_number: e.target.value })}
                placeholder="Account number"
              />
            </div>
          </div>
        )}

        {/* Mobile Money fields */}
        {form.payment_method === 'mobile_money' && (
          <div className="space-y-3 pl-4 border-l-2 border-green-200">
            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={form.mobile_money_provider} onValueChange={(v) => setForm({ ...form, mobile_money_provider: v })}>
                <SelectTrigger><SelectValue placeholder="Select provider" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="M-Pesa">M-Pesa</SelectItem>
                  <SelectItem value="Tigopesa">Tigopesa</SelectItem>
                  <SelectItem value="Airtel Money">Airtel Money</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Mobile Number</Label>
              <Input
                value={form.mobile_money_number}
                onChange={(e) => setForm({ ...form, mobile_money_number: e.target.value })}
                placeholder="e.g. 0712 345 678"
              />
            </div>
          </div>
        )}

        {/* Cash — no extra fields */}
        {form.payment_method === 'cash' && (
          <p className="text-sm text-muted-foreground pl-4 border-l-2 border-gray-200">
            Cash payments require no additional details.
          </p>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
          {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4 mr-2" />}
          Save Payment Details
        </Button>
      </CardContent>
    </Card>
  );
};
