"use client";

// Activity type badge component
import React from 'react';
import { getActivityTypeColor } from '../../utils';

interface ActivityTypeBadgeProps {
  type: string;
  className?: string;
}

export const ActivityTypeBadge: React.FC<ActivityTypeBadgeProps> = ({ type, className = '' }) => {
  return (
    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActivityTypeColor(type)} ${className}`}>
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
};


