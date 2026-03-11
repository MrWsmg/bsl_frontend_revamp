"use client";

// Supervisor Payroll section — view rejected records and resubmit
import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { AlertCircle, RotateCcw } from 'lucide-react';
import { toast } from '../../ui/sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export const SupervisorPayrollSection: React.FC = () => {
  const [resubmittingId, setResubmittingId] = useState<number | null>(null);

  const getRejectedPayroll = useCallback(() => apiService.getSupervisorRejectedPayroll(), []);

  const { data: rejectedPayroll, loading, refetch } = useApi(getRejectedPayroll);

  const handleResubmit = async (recordId: number) => {
    setResubmittingId(recordId);
    try {
      await apiService.resubmitSupervisorPayroll(recordId);
      toast.success('Payroll record resubmitted for approval');
      await refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to resubmit payroll record');
    } finally {
      setResubmittingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            Rejected Payroll Records
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Records rejected by a manager or financial controller. Review the rejection reason, then resubmit when corrected.
          </p>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !rejectedPayroll || rejectedPayroll.length === 0 ? (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
              <p className="text-muted-foreground">No rejected payroll records</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rejectedPayroll.map((record: any) => (
                <div
                  key={record.id}
                  className="border border-red-200 rounded-lg p-4 bg-red-50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{record.worker_name}</span>
                        <Badge variant="secondary">{record.worker_type}</Badge>
                        <Badge variant="destructive">Rejected</Badge>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-sm text-gray-700">
                        <div>
                          <span className="text-muted-foreground">Task:</span>{' '}
                          <span className="font-medium">{record.task_code}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Qty:</span>{' '}
                          <span className="font-medium">{record.quantity}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Rate:</span>{' '}
                          <span className="font-medium">${record.rate}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span>{' '}
                          <span className="font-semibold">${record.total_amount?.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Date:</span>{' '}
                          <span>{new Date(record.date_worked).toLocaleDateString()}</span>
                        </div>
                        {record.rejected_at && (
                          <div>
                            <span className="text-muted-foreground">Rejected:</span>{' '}
                            <span>{new Date(record.rejected_at).toLocaleDateString()}</span>
                          </div>
                        )}
                      </div>

                      {record.rejection_reason && (
                        <div className="mt-2 p-3 bg-white border border-red-200 rounded text-sm">
                          <span className="font-medium text-red-700">Rejection reason: </span>
                          <span className="text-gray-700">{record.rejection_reason}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleResubmit(record.id)}
                      disabled={resubmittingId === record.id}
                      className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 whitespace-nowrap"
                    >
                      {resubmittingId === record.id ? (
                        <LoadingSpinner size="sm" />
                      ) : (
                        <RotateCcw className="w-4 h-4" />
                      )}
                      Resubmit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
