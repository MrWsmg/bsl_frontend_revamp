"use client";

// Summary section component
import React, { useState } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';

export const SummarySection: React.FC = () => {
  const [combinedSummary, setCombinedSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const loadCombinedSummary = async () => {
    try {
      setLoading(true);
      const summaryData = await apiService.activities.getCombinedSummary();
      setCombinedSummary(summaryData);
    } catch (error) {
      console.error('Error loading combined summary:', error);
      alert('Failed to load summary. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!combinedSummary) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800">Combined Summary</h3>
            <p className="text-sm text-gray-600 mt-1">Overview of stocks and payroll activities</p>
          </div>
          <div className="p-6">
            <div className="flex justify-center items-center py-12">
              <button
                onClick={loadCombinedSummary}
                disabled={loading}
                className="bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-md flex items-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Loading...
                  </>
                ) : (
                  'Load Summary'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">Combined Summary</h3>
            <p className="text-sm text-gray-600">Overview of stocks and payroll activities</p>
          </div>
          <button
            onClick={loadCombinedSummary}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md text-sm"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Refreshing...
              </>
            ) : (
              'Refresh'
            )}
          </button>
        </div>

        <div className="p-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800">Payroll</h4>
              <p className="text-2xl font-bold text-blue-600">
                {combinedSummary.summary.total_payroll.toLocaleString()}
              </p>
              <p className="text-sm text-blue-600">
                {combinedSummary.summary.payroll_count} records
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-800">Stock Payments</h4>
              <p className="text-2xl font-bold text-green-600">
                {combinedSummary.summary.total_stock_payments.toLocaleString()}
              </p>
              <p className="text-sm text-green-600">
                {combinedSummary.summary.stock_count} records
              </p>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-800">Expenses</h4>
              <p className="text-2xl font-bold text-red-600">
                {combinedSummary.summary.total_expenses.toLocaleString()}
              </p>
              <p className="text-sm text-red-600">
                {combinedSummary.summary.expense_count} records
              </p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-800">Grand Total</h4>
              <p className="text-2xl font-bold text-purple-600">
                {combinedSummary.summary.grand_total.toLocaleString()}
              </p>
              <p className="text-sm text-purple-600">
                {combinedSummary.summary.payroll_count + combinedSummary.summary.stock_count + combinedSummary.summary.expense_count} total records
              </p>
            </div>
          </div>

          {/* Farm-wise Summary */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Farm-wise Summary</h4>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Farm</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Payroll</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(combinedSummary.farm_summary).map(([farm, data]: [string, any]) => (
                    <tr key={farm} className="border-t border-gray-200">
                      <td className="px-4 py-2 font-medium">{farm}</td>
                      <td className="px-4 py-2">{(data.payroll_total || 0).toLocaleString()}</td>
                      <td className="px-4 py-2">{(data.stock_total || 0).toLocaleString()}</td>
                      <td className="px-4 py-2 font-bold">{(data.total || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Activities */}
          <div>
            <h4 className="text-lg font-semibold text-gray-800 mb-3">Recent Activities</h4>
            <div className="space-y-2">
              {combinedSummary.recent_activities.slice(0, 10).map((activity: any, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          activity.type === 'payroll' ? 'bg-blue-100 text-blue-800' :
                          activity.type === 'stock' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                        </span>
                        {activity.crop_type && (
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            {activity.crop_type}
                          </span>
                        )}
                        <span className="text-sm text-gray-600">{activity.farm}</span>
                      </div>

                      {activity.type === 'payroll' && (
                        <div className="text-sm text-gray-700">
                          <strong>{activity.worker_name}</strong> • Task {activity.task_code}
                          <br />
                          Quantity: {activity.quantity} • Rate: {activity.rate}
                        </div>
                      )}

                      {activity.type === 'stock' && (
                        <div className="text-sm text-gray-700">
                          <strong>{activity.item_description}</strong> • Grade: {activity.grade || 'N/A'}
                          <br />
                          Quantity: {activity.quantity_kg} kg • Rate: {activity.payment_per_kg ? `${activity.payment_per_kg.toLocaleString()}/kg` : activity.payment_per_day ? `${activity.payment_per_day.toLocaleString()}/day` : 'N/A'}
                        </div>
                      )}

                      {activity.type === 'expense' && (
                        <div className="text-sm text-gray-700">
                          <strong>{activity.description}</strong>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <p className="font-bold text-gray-800">
                        {activity.type === 'payroll' ? activity.total_amount?.toLocaleString() :
                         activity.type === 'stock' ? activity.total_payment?.toLocaleString() :
                         activity.amount?.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {new Date(activity.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
