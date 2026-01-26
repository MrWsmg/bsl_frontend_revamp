"use client";

// Manager Stock section component
import React, { useCallback, useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Package, TrendingUp, Warehouse, AlertCircle } from 'lucide-react';

export const ManagerStockSection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'records' | 'inventory'>('records');

  const getStockRecords = useCallback(() => apiService.getManagerStockRecords(), []);
  const getInventory = useCallback(() => apiService.getManagerInventory(), []);

  const { data: stockRecords, loading: recordsLoading } = useApi(getStockRecords);
  const { data: inventory, loading: inventoryLoading } = useApi(getInventory);

  const loading = activeTab === 'records' ? recordsLoading : inventoryLoading;
  const data = activeTab === 'records' ? stockRecords : inventory;

  // Calculate statistics for stock records
  const stockStats = stockRecords ? {
    totalRecords: stockRecords.length,
    totalQuantity: stockRecords.reduce((sum: number, record: any) => sum + (record.quantity_kg || 0), 0),
    totalPayment: stockRecords.reduce((sum: number, record: any) => sum + (record.total_payment || 0), 0),
    averageQuantity: stockRecords.length > 0 
      ? stockRecords.reduce((sum: number, record: any) => sum + (record.quantity_kg || 0), 0) / stockRecords.length 
      : 0
  } : { totalRecords: 0, totalQuantity: 0, totalPayment: 0, averageQuantity: 0 };

  // Calculate statistics for inventory
  const inventoryStats = inventory ? {
    totalItems: inventory.length,
    totalQuantity: inventory.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0),
    lowStockItems: inventory.filter((item: any) => item.quantity < 10).length,
    uniqueFarms: new Set(inventory.map((item: any) => item.farm?.id || 0).filter(id => id > 0)).size
  } : { totalItems: 0, totalQuantity: 0, lowStockItems: 0, uniqueFarms: 0 };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {activeTab === 'records' && stockRecords && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Records</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stockStats.totalRecords}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Quantity</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stockStats.totalQuantity.toFixed(1)} kg</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Payment</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">${stockStats.totalPayment.toLocaleString()}</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Quantity</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stockStats.averageQuantity.toFixed(1)} kg</p>
              </div>
              <div className="bg-orange-500 p-3 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'inventory' && inventory && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{inventoryStats.totalItems}</p>
              </div>
              <div className="bg-blue-500 p-3 rounded-lg">
                <Warehouse className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Stock</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{inventoryStats.totalQuantity}</p>
              </div>
              <div className="bg-green-500 p-3 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{inventoryStats.lowStockItems}</p>
              </div>
              <div className="bg-red-500 p-3 rounded-lg">
                <AlertCircle className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
      <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Farms</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{inventoryStats.uniqueFarms}</p>
              </div>
              <div className="bg-purple-500 p-3 rounded-lg">
                <Warehouse className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab('records')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'records'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Stock Records
              {stockRecords && stockRecords.length > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                  {stockRecords.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'inventory'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Inventory
              {inventory && inventory.length > 0 && (
                <span className="ml-2 px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">
                  {inventory.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : !data || data.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">
                No {activeTab === 'records' ? 'stock records' : 'inventory items'} found
              </p>
            </div>
          ) : activeTab === 'records' ? (
            /* Stock Records Table */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Grade
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Picker
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity (kg)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Crop Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Farm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stockRecords?.map((record: any) => (
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {record.item_description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.grade || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.picker_name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {record.quantity_kg?.toFixed(2) || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        ${record.total_payment?.toLocaleString() || 0}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.crop_type || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {record.farm?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(record.date_recorded).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Inventory Table */
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Item Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unit
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Farm
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {inventory?.map((item: any) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.item_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.unit}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.farm?.name || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          item.quantity < 10
                            ? 'bg-red-100 text-red-800'
                            : item.quantity < 50
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {item.quantity < 10 ? 'Low Stock' : item.quantity < 50 ? 'Medium' : 'Good'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Low Stock Alert */}
      {activeTab === 'inventory' && inventory && inventoryStats.lowStockItems > 0 && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-red-800">Low Stock Alert</h3>
              <p className="text-sm text-red-700 mt-1">
                You have {inventoryStats.lowStockItems} item{inventoryStats.lowStockItems !== 1 ? 's' : ''} with low stock (less than 10 units). Consider reordering soon.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

