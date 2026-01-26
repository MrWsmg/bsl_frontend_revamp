"use client";

import React, { useState } from 'react';
import { FileText, Package, ClipboardCheck } from 'lucide-react';
import { PurchaseRequests } from '../../procurement/PurchaseRequests';
import { PurchaseOrderList } from '../../procurement/PurchaseOrderList';
import { GoodsReceiptForm } from '../../procurement/GoodsReceiptForm';
import { User } from '../../../types';

interface ProcurementSectionProps {
  user: User;
}

export const ProcurementSection: React.FC<ProcurementSectionProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'pr' | 'po' | 'grn'>('pr');

  const tabs = [
    { id: 'pr', label: 'Purchase Requests', icon: FileText },
    { id: 'po', label: 'Purchase Orders', icon: ClipboardCheck },
    { id: 'grn', label: 'Goods Receipts', icon: Package },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'pr' | 'po' | 'grn')}
                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-5 h-5 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'pr' && <PurchaseRequests userRole={user.role} />}
        {activeTab === 'po' && <PurchaseOrderList userRole={user.role} />}
        {activeTab === 'grn' && (
          <div>
            <GoodsReceiptForm
              onSuccess={() => {}}
              onCancel={() => {}}
            />
          </div>
        )}
      </div>
    </div>
  );
};

