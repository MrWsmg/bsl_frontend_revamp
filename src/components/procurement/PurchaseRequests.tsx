"use client";

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { PurchaseRequestForm } from './PurchaseRequestForm';
import { PurchaseRequestList } from './PurchaseRequestList';
import { PurchaseRequest } from '../../types';

interface PurchaseRequestsProps {
  userRole: string;
}

export const PurchaseRequests: React.FC<PurchaseRequestsProps> = ({ userRole }) => {
  const [showForm, setShowForm] = useState(false);
  const [selectedPR, setSelectedPR] = useState<PurchaseRequest | null>(null);

  const canCreate = ['manager', 'supervisor', 'admin'].includes(userRole);

  return (
    <div className="space-y-6">
      {!showForm && (
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Purchase Requests</h1>
            <p className="text-gray-600 mt-1">Manage procurement requisitions</p>
          </div>
          {canCreate && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Purchase Request
            </button>
          )}
        </div>
      )}

      {showForm ? (
        <PurchaseRequestForm
          onSuccess={() => {
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <PurchaseRequestList 
          userRole={userRole} 
          onSelectPR={setSelectedPR}
        />
      )}
    </div>
  );
};

