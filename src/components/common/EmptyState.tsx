"use client";

// Empty state component
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}) => {
  return (
    <div className={`text-center py-8 ${className}`}>
      <Icon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-500 text-sm mb-4">{description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-md"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};


