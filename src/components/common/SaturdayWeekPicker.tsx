"use client";

import React from 'react';

interface SaturdayWeekPickerProps {
  value: string;
  onChange: (date: string) => void;
  label?: string;
  disabled?: boolean;
}

function nearestSaturday(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = (6 - day + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

export const SaturdayWeekPicker: React.FC<SaturdayWeekPickerProps> = ({
  value,
  onChange,
  label = 'Week Start (Saturday)',
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sat = nearestSaturday(e.target.value);
    onChange(sat);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="date"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
      />
      {value && (
        <p className="mt-1 text-xs text-gray-500">
          Week: {value} → {(() => {
            const d = new Date(value);
            d.setDate(d.getDate() + 6);
            return d.toISOString().split('T')[0];
          })()}
        </p>
      )}
    </div>
  );
};
