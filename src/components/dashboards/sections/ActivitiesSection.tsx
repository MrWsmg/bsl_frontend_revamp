"use client";

// Activities section component
import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { ActivityTypeBadge } from '../../common/ActivityTypeBadge';

export const ActivitiesSection: React.FC = () => {
  const [activityFilters, setActivityFilters] = useState({
    farm_id: '',
    activity_type: '',
    start_date: '',
    end_date: ''
  });

  const getFarms = useCallback(() => apiService.farms.getFarms(), []);
  const getActivities = useCallback(() => apiService.activities.getAdminActivities(activityFilters), [activityFilters]);
  
  const { data: farms } = useApi(getFarms);
  const { data: activities, loading, refetch } = useApi(getActivities, { immediate: false });

  const loadActivities = async () => {
    try {
      await refetch();
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Activity Filters</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
              <select
                value={activityFilters.farm_id}
                onChange={(e) => setActivityFilters({...activityFilters, farm_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              >
                <option value="">All Farms</option>
                {farms?.map((farm: any) => (
                  <option key={farm.id} value={farm.id}>{farm.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Activity Type</label>
              <select
                value={activityFilters.activity_type}
                onChange={(e) => setActivityFilters({...activityFilters, activity_type: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              >
                <option value="">All Types</option>
                <option value="payroll">Payroll</option>
                <option value="stock">Stock</option>
                <option value="expense">Expenses</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={activityFilters.start_date}
                onChange={(e) => setActivityFilters({...activityFilters, start_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={activityFilters.end_date}
                onChange={(e) => setActivityFilters({...activityFilters, end_date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={loadActivities}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md flex items-center"
            >
              {loading ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Loading...
                </>
              ) : (
                'Apply Filters'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">All Activities</h3>
          <p className="text-sm text-gray-600 mt-1">View all data entered by clerks across all farms</p>
        </div>
        <div className="p-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <LoadingSpinner size="lg" />
            </div>
          ) : activities?.length === 0 ? (
            <p className="text-gray-500 text-sm">No activities found.</p>
          ) : (
            <div className="space-y-3">
              {activities?.map((activity: any, idx: number) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <ActivityTypeBadge type={activity.type} />
                        {activity.crop_type && (
                          <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            {activity.crop_type.charAt(0).toUpperCase() + activity.crop_type.slice(1)}
                          </span>
                        )}
                        <span className="text-sm text-gray-600">{activity.farm || 'Unknown farm'}</span>
                      </div>

                      {activity.type === 'payroll' && (
                        <div className="text-sm text-gray-700">
                          <strong>{activity.worker_name}</strong> • Task {activity.task_code} • Quantity: {activity.quantity} • Rate: {activity.rate} • Total: <strong>{activity.total_amount?.toLocaleString?.() || activity.total_amount}</strong>
                          <br />
                          <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                            activity.worker_type === 'permanent' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                          }`}>
                            {activity.worker_type === 'permanent' ? 'Permanent' : 'Contracted'}
                          </span>
                          {activity.block && (
                            <span className="inline-block ml-2 px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              Block: {activity.block}
                            </span>
                          )}
                        </div>
                      )}

                      {activity.type === 'stock' && (
                        <div className="text-sm text-gray-700">
                          <strong>{activity.item_description}</strong> • Grade: {activity.grade || 'N/A'} • Picker: {activity.picker_name || 'N/A'} • Quantity: {activity.quantity_kg} kg • Total Payment: <strong>{activity.total_payment?.toLocaleString?.() || activity.total_payment}</strong>
                        </div>
                      )}

                      {activity.type === 'expense' && (
                        <div className="text-sm text-gray-700">
                          <strong>{activity.description}</strong> • Amount: <strong>{activity.amount?.toLocaleString?.() || activity.amount}</strong>
                        </div>
                      )}
                    </div>

                    <div className="text-right text-xs text-gray-500">
                      {new Date(activity.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
