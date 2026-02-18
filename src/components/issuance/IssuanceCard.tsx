"use client";

import React from 'react';
import { Package, Clock, User, MapPin, Check, Loader2, Camera } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { PendingIssuance, IssuanceStatus } from '@/types/farm-clerk';

interface IssuanceCardProps {
  issuance: PendingIssuance;
  onPrepare?: (id: number) => void;
  onConfirm?: (id: number) => void;
  onUploadPhoto?: (id: number) => void;
  preparing?: boolean;
  confirming?: boolean;
  isSupervisor?: boolean;
}

export const IssuanceCard: React.FC<IssuanceCardProps> = ({
  issuance,
  onPrepare,
  onConfirm,
  onUploadPhoto,
  preparing = false,
  confirming = false,
  isSupervisor = false,
}) => {
  const getStatusBadge = (status: IssuanceStatus) => {
    const variants: Record<IssuanceStatus, { variant: 'default' | 'secondary' | 'outline' | 'destructive'; label: string }> = {
      pending: { variant: 'outline', label: 'Pending Approval' },
      approved: { variant: 'secondary', label: 'Approved' },
      prepared: { variant: 'default', label: 'Prepared' },
      confirmed: { variant: 'default', label: 'Confirmed' },
      dispatched: { variant: 'default', label: 'Dispatched' },
      rejected: { variant: 'destructive', label: 'Rejected' },
    };
    return variants[status] || { variant: 'outline' as const, label: status };
  };

  const getPriorityBadge = (priority?: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive'; label: string }> = {
      low: { variant: 'secondary', label: 'Low' },
      normal: { variant: 'default', label: 'Normal' },
      high: { variant: 'destructive', label: 'High' },
      urgent: { variant: 'destructive', label: 'Urgent' },
    };
    return variants[priority || 'normal'] || { variant: 'default' as const, label: 'Normal' };
  };

  const statusBadge = getStatusBadge(issuance.status);
  const priorityBadge = getPriorityBadge(issuance.priority);

  const canPrepare = issuance.status === 'approved' && !isSupervisor;
  const canConfirm = issuance.status === 'prepared' && isSupervisor;
  const canUploadPhoto = issuance.status === 'confirmed' && !isSupervisor;

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* Header with badges */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
              {issuance.priority && issuance.priority !== 'normal' && (
                <Badge variant={priorityBadge.variant}>{priorityBadge.label}</Badge>
              )}
            </div>

            {/* Item details */}
            <div className="flex items-start gap-3">
              <div className="bg-primary/10 p-2 rounded-lg">
                <Package className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{issuance.item_name}</h3>
                <p className="text-muted-foreground">
                  Quantity: <span className="font-medium text-foreground">{issuance.quantity} {issuance.unit}</span>
                </p>
              </div>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Requested by: <span className="text-foreground">{issuance.requester_name}</span></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Farm: <span className="text-foreground">{issuance.farm_name || issuance.farm?.name}</span></span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>Requested: <span className="text-foreground">{new Date(issuance.created_at).toLocaleDateString()}</span></span>
              </div>
              {issuance.gate_pass_number && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <span>Gate Pass: <span className="text-foreground font-medium">{issuance.gate_pass_number}</span></span>
                </div>
              )}
            </div>

            {/* Timeline */}
            {(issuance.prepared_at || issuance.confirmed_at || issuance.dispatched_at) && (
              <div className="border-t pt-3 mt-3">
                <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                  {issuance.prepared_at && (
                    <div>
                      <span className="font-medium">Prepared:</span>{' '}
                      {new Date(issuance.prepared_at).toLocaleString()}
                    </div>
                  )}
                  {issuance.confirmed_at && (
                    <div>
                      <span className="font-medium">Confirmed:</span>{' '}
                      {new Date(issuance.confirmed_at).toLocaleString()}
                    </div>
                  )}
                  {issuance.dispatched_at && (
                    <div>
                      <span className="font-medium">Dispatched:</span>{' '}
                      {new Date(issuance.dispatched_at).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Notes */}
            {issuance.notes && (
              <div className="bg-muted/50 p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">{issuance.notes}</p>
              </div>
            )}

            {/* Dispatch photo */}
            {issuance.dispatch_photo_url && (
              <div className="mt-3">
                <p className="text-xs text-muted-foreground mb-2">Dispatch Photo:</p>
                <img
                  src={issuance.dispatch_photo_url}
                  alt="Dispatch"
                  className="rounded-lg max-w-xs border"
                />
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex sm:flex-col gap-2">
            {canPrepare && (
              <Button
                onClick={() => onPrepare?.(issuance.id)}
                disabled={preparing}
                className="w-full sm:w-auto"
              >
                {preparing ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Prepare
              </Button>
            )}

            {canConfirm && (
              <Button
                onClick={() => onConfirm?.(issuance.id)}
                disabled={confirming}
                className="w-full sm:w-auto"
              >
                {confirming ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Check className="mr-2 h-4 w-4" />
                )}
                Confirm
              </Button>
            )}

            {canUploadPhoto && (
              <Button
                variant="outline"
                onClick={() => onUploadPhoto?.(issuance.id)}
                className="w-full sm:w-auto"
              >
                <Camera className="mr-2 h-4 w-4" />
                Upload Photo
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IssuanceCard;
