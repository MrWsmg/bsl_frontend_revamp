"use client";

// Stock Reports Section
import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Package, TrendingUp, Filter } from 'lucide-react';

export const StockReportsSection: React.FC = () => {
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const getFarms = useCallback(() => apiService.getStockFarms(), []);
  
  const getSummary = useCallback(() => {
    const params: any = {};
    if (selectedFarm !== 'all') params.farm_id = parseInt(selectedFarm);
    if (startDate) params.start_date = startDate;
    if (endDate) params.end_date = endDate;
    return apiService.getStockSummary(params);
  }, [selectedFarm, startDate, endDate]);

  const { data: farms } = useApi(getFarms);
  const { data: summary, loading } = useApi(getSummary);

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-900">Filters</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
            <select
              value={selectedFarm}
              onChange={(e) => setSelectedFarm(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            >
              <option value="all">All Farms</option>
              {farms?.map((farm: any) => (
                <option key={farm.id} value={farm.id}>{farm.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedFarm('all');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-4 py-2 rounded-md"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Records</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {summary?.total_records || 0}
                  </p>
                </div>
                <div className="bg-blue-500 p-3 rounded-lg">
                  <Package className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Stock In</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    {summary?.stock_in_records || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Qty: {summary?.stock_in_quantity || 0}
                  </p>
                </div>
                <div className="bg-green-500 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Stock Out</p>
                  <p className="text-3xl font-bold text-red-600 mt-2">
                    {summary?.stock_out_records || 0}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Qty: {summary?.stock_out_quantity || 0}
                  </p>
                </div>
                <div className="bg-red-500 p-3 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-white transform rotate-180" />
                </div>
              </div>
            </div>
          </div>

          {/* Detailed Summary */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Unique Items</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary?.unique_items || 0}
                </p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Stock In</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary?.total_stock_in || 0}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Total Stock Out</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {summary?.total_stock_out || 0}
                </p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Net Balance</p>
                <p className={`text-2xl font-bold mt-1 ${
                  (summary?.net_balance || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {summary?.net_balance || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Item Breakdown */}
          {summary?.items_breakdown && summary.items_breakdown.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Item Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock In</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock Out</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {summary.items_breakdown.map((item: any, index: number) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item.item_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {item.item_code}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                          +{item.stock_in}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                          -{item.stock_out}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">
                          <span className={item.balance >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {item.balance}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Farm Breakdown */}
          {summary?.farms_breakdown && summary.farms_breakdown.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Farm Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {summary.farms_breakdown.map((farm: any) => (
                  <div key={farm.farm_id} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-2">{farm.farm_name}</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Records:</span>
                        <span className="font-medium">{farm.total_records}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stock In:</span>
                        <span className="font-medium text-green-600">{farm.stock_in}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Stock Out:</span>
                        <span className="font-medium text-red-600">{farm.stock_out}</span>
                      </div>
                      <div className="flex justify-between border-t pt-1 mt-1">
                        <span className="text-gray-600">Balance:</span>
                        <span className={`font-semibold ${farm.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {farm.balance}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

