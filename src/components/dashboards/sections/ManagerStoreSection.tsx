"use client";

import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Warehouse, AlertCircle, Search, X } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';

const LOW_STOCK_THRESHOLD = 10;

export const ManagerStoreSection: React.FC = () => {
  const { user } = useAuth();
  const farmId: number | null = (user as any)?.farm_id ?? null;

  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [searchTriggered, setSearchTriggered] = useState(false);

  // Farm stock from CARDEX — only fetch once we have a real farm_id
  const fetchStore = useCallback(
    () => farmId != null ? apiService.getStoreDetail(farmId) : Promise.resolve(null),
    [farmId]
  );
  const { data: storeRaw, loading: storeLoading } = useApi(fetchStore, { dependencies: [farmId] });

  // Normalize — backend may return { items: [] } or []
  const storeItems: any[] = Array.isArray(storeRaw)
    ? storeRaw
    : Array.isArray(storeRaw?.items)
    ? storeRaw.items
    : storeRaw?.cardex_items ?? storeRaw?.stock ?? [];

  // Cross-farm search
  const fetchSearch = useCallback(
    () => searchQuery ? apiService.searchStock(searchQuery) : Promise.resolve([]),
    [searchQuery]
  );
  const { data: searchRaw, loading: searchLoading } = useApi(fetchSearch);
  const searchResults: any[] = Array.isArray(searchRaw) ? searchRaw : [];

  const lowStock = storeItems.filter(item => (item.current_balance ?? item.quantity ?? 0) < LOW_STOCK_THRESHOLD);

  const triggerSearch = () => {
    setSearchQuery(searchInput.trim());
    setSearchTriggered(true);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
    setSearchTriggered(false);
  };

  const balanceOf = (item: any) => item.current_balance ?? item.quantity ?? 0;
  const unitOf = (item: any) => item.unit ?? item.unit_of_measure ?? '';
  const valueOf = (item: any) => item.current_value ?? item.total_value ?? null;

  const fmt = (d?: string) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && triggerSearch()}
            placeholder="Search item across all farms..."
            className="w-full pl-9 border border-gray-300 rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <button
          onClick={triggerSearch}
          className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
        >
          Search
        </button>
        {searchTriggered && (
          <button onClick={clearSearch} className="px-3 py-2 border rounded-lg text-gray-500 hover:bg-gray-50">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Cross-farm search results */}
      {searchTriggered && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-3 border-b bg-blue-50">
            <p className="text-sm font-medium text-blue-800">
              Search results for "{searchQuery}"
              {!searchLoading && ` — ${searchResults.length} item(s) found`}
            </p>
          </div>
          {searchLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner size="md" /></div>
          ) : searchResults.length === 0 ? (
            <p className="text-center py-8 text-gray-500 text-sm">No items found</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Item', 'Farm', 'Balance', 'Unit', 'Value', 'Status'].map(h => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchResults.map((item: any, i: number) => {
                    const bal = balanceOf(item);
                    return (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-6 py-3 text-sm font-medium text-gray-900">{item.item_name}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{item.farm?.name || item.farm_name || `Farm #${item.farm_id}`}</td>
                        <td className="px-6 py-3 text-sm font-semibold">{bal} {unitOf(item)}</td>
                        <td className="px-6 py-3 text-sm text-gray-500">{unitOf(item)}</td>
                        <td className="px-6 py-3 text-sm text-gray-600">{valueOf(item) != null ? `TZS ${Number(valueOf(item)).toLocaleString()}` : '—'}</td>
                        <td className="px-6 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${bal < LOW_STOCK_THRESHOLD ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {bal < LOW_STOCK_THRESHOLD ? 'Low Stock' : 'OK'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Low stock alerts */}
      {!storeLoading && lowStock.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-red-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {lowStock.length} Low Stock Alert{lowStock.length > 1 ? 's' : ''}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lowStock.map((item: any, i: number) => (
              <div key={i} className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-900">{item.item_name}</p>
                  <p className="text-xs text-red-600 mt-0.5">{balanceOf(item)} {unitOf(item)} remaining</p>
                </div>
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main stock table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Warehouse className="w-5 h-5 text-gray-500" /> Farm Stock (CARDEX)
          </h3>
          {!storeLoading && (
            <span className="text-sm text-gray-500">{storeItems.length} items</span>
          )}
        </div>

        {storeLoading ? (
          <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>
        ) : storeItems.length === 0 ? (
          <div className="text-center py-16">
            <Warehouse className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No stock records found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {['Item Name', 'Balance', 'Value', 'Last Received', 'Last Issued', 'Status'].map(h => (
                    <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {storeItems.map((item: any, i: number) => {
                  const bal = balanceOf(item);
                  const isLow = bal < LOW_STOCK_THRESHOLD;
                  return (
                    <tr key={i} className={`hover:bg-gray-50 ${isLow ? 'bg-red-50/40' : ''}`}>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{item.item_name}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {bal} {unitOf(item)}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-600">
                        {valueOf(item) != null ? `TZS ${Number(valueOf(item)).toLocaleString()}` : '—'}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{fmt(item.last_receipt_date)}</td>
                      <td className="px-6 py-3 whitespace-nowrap text-sm text-gray-500">{fmt(item.last_issue_date)}</td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          isLow ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {isLow ? 'Low Stock' : 'OK'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
