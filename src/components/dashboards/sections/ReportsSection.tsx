"use client";

// Reports section component
import React, { useState, useCallback } from 'react';
import { Eye } from 'lucide-react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';

export const ReportsSection: React.FC = () => {
  const [dailyReport, setDailyReport] = useState<any>(null);
  const [weeklyReport, setWeeklyReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [dailyReportFilters, setDailyReportFilters] = useState({
    date: new Date().toISOString().split('T')[0],
    farm_id: ''
  });
  const [weeklyReportFilters, setWeeklyReportFilters] = useState({
    week_start: '',
    farm_id: ''
  });

  const getFarms = useCallback(() => apiService.farms.getFarms(), []);
  const { data: farms } = useApi(getFarms);

  const generateDailyReport = async () => {
    try {
      setLoading(true);
      const reportData = await apiService.reports.getDailyReport(
        dailyReportFilters.date,
        dailyReportFilters.farm_id ? parseInt(dailyReportFilters.farm_id) : undefined
      );
      setDailyReport(reportData);
    } catch (error) {
      console.error('Error generating daily report:', error);
      alert('Failed to generate daily report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyReport = async () => {
    try {
      setLoading(true);
      const reportData = await apiService.reports.getWeeklyReport(
        weeklyReportFilters.week_start,
        weeklyReportFilters.farm_id ? parseInt(weeklyReportFilters.farm_id) : undefined
      );
      setWeeklyReport(reportData);
    } catch (error) {
      console.error('Error generating weekly report:', error);
      alert('Failed to generate weekly report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async (format: 'excel' | 'pdf') => {
    try {
      if (format === 'excel') {
        await apiService.reports.downloadDailyReportExcel(
          dailyReportFilters.date,
          dailyReportFilters.farm_id ? parseInt(dailyReportFilters.farm_id) : undefined
        );
      } else {
        await apiService.reports.downloadDailyReportPDF(
          dailyReportFilters.date,
          dailyReportFilters.farm_id ? parseInt(dailyReportFilters.farm_id) : undefined
        );
      }
    } catch (error) {
      console.error(`Error downloading ${format} report:`, error);
      alert(`Failed to download ${format.toUpperCase()} report. Please try again.`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Daily Report Generator */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Daily Report Generator</h3>
          <p className="text-sm text-gray-600 mt-1">Generate and print daily activity reports</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Date</label>
              <input
                type="date"
                value={dailyReportFilters.date}
                onChange={(e) => setDailyReportFilters({...dailyReportFilters, date: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm (Optional)</label>
              <select
                value={dailyReportFilters.farm_id}
                onChange={(e) => setDailyReportFilters({...dailyReportFilters, farm_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              >
                <option value="">All Farms</option>
                {farms?.map((farm: any) => (
                  <option key={farm.id} value={farm.id}>{farm.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={generateDailyReport}
                disabled={loading}
                className="w-full bg-blue-500 hover:bg-blue-700 disabled:bg-blue-300 text-white px-4 py-2 rounded-md flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating...
                  </>
                ) : (
                  'Generate Report'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Report Display */}
      {dailyReport && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Daily Report</h3>
              <p className="text-sm text-gray-600">
                {new Date(dailyReportFilters.date).toLocaleDateString()} •
                Farm: {dailyReportFilters.farm_id ? farms?.find(f => f.id === parseInt(dailyReportFilters.farm_id))?.name : 'All Farms'}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => window.print()}
                className="bg-green-500 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                <Eye className="w-4 h-4 mr-2" />
                Print Report
              </button>
              <button
                onClick={() => downloadReport('excel')}
                className="bg-blue-500 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                📊 Excel
              </button>
              <button
                onClick={() => downloadReport('pdf')}
                className="bg-red-500 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center"
              >
                📄 PDF
              </button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-800">Payroll</h4>
                <p className="text-2xl font-bold text-blue-600">{dailyReport.summary.total_payroll.toLocaleString()}</p>
                <p className="text-sm text-blue-600">{dailyReport.summary.payroll_count} records</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-800">Stock Payments</h4>
                <p className="text-2xl font-bold text-green-600">{dailyReport.summary.total_stock_payments.toLocaleString()}</p>
                <p className="text-sm text-green-600">{dailyReport.summary.stock_count} records</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <h4 className="font-semibold text-red-800">Expenses</h4>
                <p className="text-2xl font-bold text-red-600">{dailyReport.summary.total_expenses.toLocaleString()}</p>
                <p className="text-sm text-red-600">{dailyReport.summary.expense_count} records</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-semibold text-purple-800">Grand Total</h4>
                <p className="text-2xl font-bold text-purple-600">{dailyReport.summary.grand_total.toLocaleString()}</p>
                <p className="text-sm text-purple-600">{dailyReport.summary.payroll_count + dailyReport.summary.stock_count + dailyReport.summary.expense_count} total records</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Weekly Report Generator */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800">Weekly Report Generator</h3>
          <p className="text-sm text-gray-600 mt-1">Generate weekly totals for all farms</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Week Start Date</label>
              <input
                type="date"
                value={weeklyReportFilters.week_start}
                onChange={(e) => setWeeklyReportFilters({...weeklyReportFilters, week_start: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Farm (Optional)</label>
              <select
                value={weeklyReportFilters.farm_id}
                onChange={(e) => setWeeklyReportFilters({...weeklyReportFilters, farm_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
              >
                <option value="">All Farms</option>
                {farms?.map((farm: any) => (
                  <option key={farm.id} value={farm.id}>{farm.name}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={generateWeeklyReport}
                disabled={loading}
                className="w-full bg-green-500 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-md flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Generating...
                  </>
                ) : (
                  'Generate Weekly Report'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
