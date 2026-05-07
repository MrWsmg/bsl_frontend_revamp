"use client";

import React from 'react';
import { CherryParchmentPage } from '@/components/cherry-parchment/CherryParchmentPage';

export const StockCherryParchmentSection: React.FC = () => {
  return (
    <div className="p-4 space-y-2">
      <div>
        <h2 className="text-lg font-semibold">Cherry & Parchment</h2>
        <p className="text-sm text-muted-foreground">
          Track cherry intake, hopper stock, and cherry-to-parchment processing with per-block visibility.
        </p>
      </div>
      <CherryParchmentPage />
    </div>
  );
};
