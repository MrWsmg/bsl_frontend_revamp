"use client";

import React from 'react';

interface ApprovalStatusBadgeProps {
  status: string;
}

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  supervisor_pending: { label: 'Pending',          className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  manager_approved:   { label: 'Manager Approved', className: 'bg-blue-100 text-blue-800 border-blue-200'       },
  approved:           { label: 'Approved',          className: 'bg-green-100 text-green-800 border-green-200'   },
  rejected:           { label: 'Rejected',          className: 'bg-red-100 text-red-800 border-red-200'         },
  // legacy alias
  pending:            { label: 'Pending',          className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
};

export const ApprovalStatusBadge: React.FC<ApprovalStatusBadgeProps> = ({ status }) => {
  const cfg = STATUS_MAP[status] ?? { label: status, className: 'bg-gray-100 text-gray-700 border-gray-200' };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${cfg.className}`}>
      {cfg.label}
    </span>
  );
};
