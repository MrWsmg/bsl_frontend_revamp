"use client";

import { useState } from 'react';
import { CheckCircle, XCircle, Hand, Image as ImageIcon, ChevronDown, ChevronUp } from 'lucide-react';
import { AttendanceRecord } from '../../types';

interface AttendanceRecordsTableProps {
  records: AttendanceRecord[];
  showVerificationDetails?: boolean;
}

export function AttendanceRecordsTable({
  records,
  showVerificationDetails = true
}: AttendanceRecordsTableProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Toggle row expansion
  const toggleRowExpansion = (id: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // Render verification status badge
  const renderVerificationBadge = (record: AttendanceRecord) => {
    if (!record.face_verification_status) return null;

    const badges = {
      verified: {
        icon: CheckCircle,
        text: 'Verified',
        className: 'bg-green-100 text-green-800 border-green-200'
      },
      failed: {
        icon: XCircle,
        text: 'Failed',
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200'
      },
      manual: {
        icon: Hand,
        text: 'Manual',
        className: 'bg-gray-100 text-gray-800 border-gray-200'
      }
    };

    const badge = badges[record.face_verification_status];
    if (!badge) return null;

    const Icon = badge.icon;

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${badge.className}`}
      >
        <Icon className="w-3 h-3" />
        {badge.text}
      </span>
    );
  };

  // Render confidence score
  const renderConfidenceScore = (confidence: number | null | undefined) => {
    if (confidence === null || confidence === undefined) return null;

    const getColor = (score: number) => {
      if (score >= 90) return 'text-green-600 bg-green-50';
      if (score >= 80) return 'text-yellow-600 bg-yellow-50';
      return 'text-red-600 bg-red-50';
    };

    return (
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${getColor(confidence)}`}>
            {confidence.toFixed(1)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full ${
              confidence >= 90
                ? 'bg-green-600'
                : confidence >= 80
                ? 'bg-yellow-600'
                : 'bg-red-600'
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    );
  };

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  if (records.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">No attendance records found</p>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Worker
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Farm
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                {showVerificationDetails && (
                  <>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Verification
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confidence
                    </th>
                  </>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {records.map((record) => {
                const { date, time } = formatDateTime(record.date);
                const isExpanded = expandedRows.has(record.id);

                return (
                  <>
                    <tr key={record.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div>
                          <p className="font-medium text-gray-900">{record.worker_name}</p>
                          <p className="text-xs text-gray-500">ID: {record.worker_id}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {record.farm_name || `Farm ${record.farm_id}`}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="text-gray-900">{date}</p>
                          {record.check_in_time && (
                            <p className="text-xs text-gray-500">{time}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                            record.status === 'present'
                              ? 'bg-green-100 text-green-800'
                              : record.status === 'absent'
                              ? 'bg-red-100 text-red-800'
                              : record.status === 'leave'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </span>
                      </td>
                      {showVerificationDetails && (
                        <>
                          <td className="px-4 py-3">{renderVerificationBadge(record)}</td>
                          <td className="px-4 py-3">
                            {renderConfidenceScore(record.face_verification_confidence)}
                          </td>
                        </>
                      )}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleRowExpansion(record.id)}
                          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                        >
                          {isExpanded ? (
                            <>
                              <ChevronUp className="w-4 h-4" /> Hide
                            </>
                          ) : (
                            <>
                              <ChevronDown className="w-4 h-4" /> View
                            </>
                          )}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded row details */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={showVerificationDetails ? 7 : 5} className="px-4 py-4 bg-gray-50">
                          <div className="space-y-3">
                            {/* Check-in/out times */}
                            <div className="grid grid-cols-2 gap-4">
                              {record.check_in_time && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Check-in Time</p>
                                  <p className="text-sm text-gray-900 mt-1">
                                    {new Date(record.check_in_time).toLocaleTimeString()}
                                  </p>
                                </div>
                              )}
                              {record.check_out_time && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Check-out Time</p>
                                  <p className="text-sm text-gray-900 mt-1">
                                    {new Date(record.check_out_time).toLocaleTimeString()}
                                  </p>
                                </div>
                              )}
                              {record.hours_worked !== undefined && record.hours_worked !== null && (
                                <div>
                                  <p className="text-xs font-medium text-gray-500">Hours Worked</p>
                                  <p className="text-sm text-gray-900 mt-1">
                                    {record.hours_worked.toFixed(2)} hours
                                  </p>
                                </div>
                              )}
                            </div>

                            {/* Verification photo */}
                            {record.verification_photo_url && (
                              <div>
                                <p className="text-xs font-medium text-gray-500 mb-2">
                                  Verification Photo
                                </p>
                                <button
                                  onClick={() => setSelectedPhoto(record.verification_photo_url!)}
                                  className="inline-flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                  <ImageIcon className="w-4 h-4 text-gray-600" />
                                  <span className="text-sm text-gray-700">View Photo</span>
                                </button>
                              </div>
                            )}

                            {/* Notes */}
                            {record.notes && (
                              <div>
                                <p className="text-xs font-medium text-gray-500">Notes</p>
                                <p className="text-sm text-gray-900 mt-1">{record.notes}</p>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 text-sm"
            >
              Close
            </button>
            <img
              src={selectedPhoto}
              alt="Verification"
              className="max-w-full max-h-[85vh] rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  );
}
