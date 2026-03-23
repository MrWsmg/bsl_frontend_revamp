"use client";

import React from 'react';

interface DocLinkProps {
  label: string;
  onClick?: () => void;
  className?: string;
}

export function DocLink({ label, onClick, className }: DocLinkProps) {
  if (!onClick) {
    return <span className="text-muted-foreground text-sm">—</span>;
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center px-2 py-0.5 rounded border border-blue-200 bg-blue-50 text-blue-700 text-xs font-mono hover:bg-blue-100 hover:border-blue-400 transition-colors ${className ?? ''}`}
    >
      {label}
    </button>
  );
}
