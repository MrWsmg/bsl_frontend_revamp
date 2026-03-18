"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Warehouse, Search, RefreshCw, ChevronDown, ChevronRight, AlertCircle } from 'lucide-react';

export const ProcurementStoreSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [expandedFarm, setExpandedFarm] = useState<number | null>(null);

  const getStores = useCallback(() => apiService.getStores(), []);
  const { data: stores, loading, error, refetch } = useApi(getStores);

  const handleSearch = async () => {
    if (!searchQuery.trim()) { setSearchResults(null); return; }
    setSearching(true);
    try {
      const results = await apiService.searchStock(searchQuery.trim());
      setSearchResults(Array.isArray(results) ? results : []);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const storeList = Array.isArray(stores) ? stores : [];

  return (
    <div className="space-y-4">
      {/* Search across all farms */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
            <Search className="w-4 h-4 text-amber-600" />
            Stock Search — All Farms
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search item name across all farms…"
              className="flex-1"
            />
            <Button onClick={handleSearch} disabled={searching} className="bg-amber-600 hover:bg-amber-700 text-white">
              {searching ? 'Searching…' : 'Search'}
            </Button>
          </div>

          {searchResults !== null && (
            searchResults.length === 0 ? (
              <p className="text-sm text-gray-500 py-2">No stock found for "{searchQuery}"</p>
            ) : (
              <div className="space-y-1">
                {searchResults.map((r: any, i: number) => (
                  <div key={i} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2 text-sm">
                    <div>
                      <span className="font-medium text-gray-800">{r.item_name}</span>
                      <span className="text-gray-400 ml-2 text-xs">{r.farm_name}</span>
                    </div>
                    <div className="text-right">
                      <span className={`font-semibold ${r.current_balance > 0 ? 'text-green-700' : 'text-red-600'}`}>
                        {r.current_balance} {r.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}
        </CardContent>
      </Card>

      {/* All stores */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <Warehouse className="w-4 h-4 text-amber-600" />
              Store Inventory (CARDEX)
            </CardTitle>
            <Button size="sm" variant="outline" onClick={() => refetch()}>
              <RefreshCw className="w-3.5 h-3.5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700 mb-4">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
          ) : storeList.length === 0 ? (
            <div className="text-center py-10 text-gray-400">
              <Warehouse className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No store data available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {storeList.map((store: any) => {
                const farmId = store.farm_id ?? store.id;
                const isExpanded = expandedFarm === farmId;
                const items: any[] = store.inventory ?? store.items ?? [];
                const totalItems = store.total_items ?? store.item_count ?? items.length;

                return (
                  <div key={farmId} className="border border-gray-100 rounded-lg overflow-hidden">
                    <button
                      onClick={() => setExpandedFarm(isExpanded ? null : farmId)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-gray-800">{store.farm_name ?? store.name}</p>
                          <p className="text-xs text-gray-400">{totalItems} item types</p>
                        </div>
                      </div>
                      <div className="text-right">
                        {store.low_stock_count > 0 && (
                          <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                            {store.low_stock_count} low stock
                          </span>
                        )}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50/50">
                        {items.length === 0 ? (
                          <p className="text-xs text-gray-400 px-5 py-3">No items in stock</p>
                        ) : (
                          <div className="divide-y divide-gray-100">
                            {items.map((item: any, i: number) => (
                              <div key={i} className="flex items-center justify-between px-5 py-2.5">
                                <div>
                                  <p className="text-sm text-gray-800 font-medium">{item.item_name}</p>
                                  {item.category && (
                                    <p className="text-xs text-gray-400">{item.category}</p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className={`text-sm font-semibold ${
                                    (item.current_balance ?? item.quantity ?? 0) <= (item.reorder_level ?? 0)
                                      ? 'text-red-600'
                                      : 'text-green-700'
                                  }`}>
                                    {item.current_balance ?? item.quantity ?? 0} {item.unit}
                                  </p>
                                  {item.reorder_level != null && (
                                    <p className="text-xs text-gray-400">reorder at {item.reorder_level}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
