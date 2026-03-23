"use client";

import React from 'react';

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  // Generic
  draft:                  { label: 'Draft',                className: 'bg-gray-100 text-gray-700' },
  pending:                { label: 'Pending',              className: 'bg-yellow-100 text-yellow-800' },
  approved:               { label: 'Approved',             className: 'bg-green-100 text-green-800' },
  rejected:               { label: 'Rejected',             className: 'bg-red-100 text-red-800' },
  cancelled:              { label: 'Cancelled',            className: 'bg-gray-100 text-gray-500' },
  completed:              { label: 'Completed',            className: 'bg-blue-100 text-blue-800' },
  // GRN / LPO specific
  pending_fm_approval:    { label: 'Awaiting FM Approval', className: 'bg-yellow-100 text-yellow-800' },
  partially_fulfilled:    { label: 'Partially Fulfilled',  className: 'bg-amber-100 text-amber-800' },
  fulfilled:              { label: 'Fulfilled',            className: 'bg-green-100 text-green-800' },
  // GIN
  pending_approval:       { label: 'Pending Approval',     className: 'bg-yellow-100 text-yellow-800' },
  issued:                 { label: 'Issued',               className: 'bg-green-100 text-green-800' },
  // SMR
  pending_pfi:            { label: 'Pending PFI',          className: 'bg-blue-100 text-blue-800' },
  pfi_selected:           { label: 'PFI Selected',         className: 'bg-indigo-100 text-indigo-800' },
  lpo_issued:             { label: 'LPO Issued',           className: 'bg-purple-100 text-purple-800' },
  // Transport / Delivery
  pending_dispatch:       { label: 'Pending Dispatch',     className: 'bg-yellow-100 text-yellow-800' },
  dispatched:             { label: 'Dispatched',           className: 'bg-blue-100 text-blue-800' },
  delivered:              { label: 'Delivered',            className: 'bg-green-100 text-green-800' },
  signed:                 { label: 'Signed',               className: 'bg-green-100 text-green-700' },
  // Inspection
  passed:                 { label: 'Passed',               className: 'bg-green-100 text-green-800' },
  failed:                 { label: 'Failed',               className: 'bg-red-100 text-red-800' },
  partial:                { label: 'Partial',              className: 'bg-amber-100 text-amber-800' },
};

interface ProcurementStatusBadgeProps {
  status: string;
  className?: string;
}

export function ProcurementStatusBadge({ status, className }: ProcurementStatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()),
    className: 'bg-gray-100 text-gray-700',
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${config.className} ${className ?? ''}`}
    >
      {config.label}
    </span>
  );
}
