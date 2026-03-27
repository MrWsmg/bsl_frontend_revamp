"use client";

// Status badge component
import React from 'react';
import { getStatusColor } from '../../utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(status)} ${className}`}>
      {status.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
    </span>
  );
};
