"use client";

import { useState, Fragment } from 'react';
import { CheckCircle, XCircle, Hand, Image as ImageIcon, ChevronDown, ChevronUp, X } from 'lucide-react';
import { AttendanceRecord } from '../../types';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

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
        variant: 'default' as const,
        className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100'
      },
      failed: {
        icon: XCircle,
        text: 'Failed',
        variant: 'secondary' as const,
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100'
      },
      manual: {
        icon: Hand,
        text: 'Manual',
        variant: 'outline' as const,
        className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-100'
      }
    };

    const badge = badges[record.face_verification_status];
    if (!badge) return null;

    const Icon = badge.icon;

    return (
      <Badge variant={badge.variant} className={badge.className}>
        <Icon className="w-3 h-3 mr-1" />
        {badge.text}
      </Badge>
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
      <figure className="space-y-1 m-0">
        <figcaption className="flex items-center gap-2">
          <data value={confidence} className={`text-xs font-semibold px-2 py-0.5 rounded ${getColor(confidence)}`}>
            {confidence.toFixed(1)}%
          </data>
        </figcaption>
        <meter
          value={confidence}
          min={0}
          max={100}
          low={80}
          high={90}
          optimum={95}
          className="w-full h-1.5"
          style={{
            appearance: 'none',
            background: '#e5e7eb',
            borderRadius: '9999px',
          }}
        />
      </figure>
    );
  };

  // Format date and time
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      iso: date.toISOString()
    };
  };

  // Get status badge variant
  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline', className: string }> = {
      present: { variant: 'default', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
      absent: { variant: 'destructive', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
      leave: { variant: 'secondary', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
      sick: { variant: 'secondary', className: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100' }
    };
    return variants[status] || { variant: 'outline' as const, className: '' };
  };

  if (records.length === 0) {
    return (
      <output className="block bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">No attendance records found</p>
      </output>
    );
  }

  return (
    <>
      <section className="bg-white rounded-lg shadow-md overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Worker</TableHead>
              <TableHead>Farm</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Status</TableHead>
              {showVerificationDetails && (
                <>
                  <TableHead>Verification</TableHead>
                  <TableHead>Confidence</TableHead>
                </>
              )}
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => {
              const { date, time, iso } = formatDateTime(record.date);
              const isExpanded = expandedRows.has(record.id);
              const statusBadge = getStatusBadge(record.status);

              return (
                <Fragment key={record.id}>
                  <TableRow className="hover:bg-gray-50">
                    <TableCell>
                      <address className="not-italic">
                        <strong className="block font-medium text-gray-900">
                          {record.worker_name || record.worker?.full_name || record.worker?.name || '—'}
                        </strong>
                        <small className="text-xs text-gray-500">ID: {record.worker_id}</small>
                      </address>
                    </TableCell>
                    <TableCell className="text-sm text-gray-900">
                      {record.farm_name || record.farm?.name || `Farm ${record.farm_id}`}
                    </TableCell>
                    <TableCell>
                      <time dateTime={iso} className="text-sm">
                        <span className="block text-gray-900">{date}</span>
                        {record.check_in_time && (
                          <small className="text-xs text-gray-500">{time}</small>
                        )}
                      </time>
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadge.variant} className={statusBadge.className}>
                        {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                      </Badge>
                    </TableCell>
                    {showVerificationDetails && (
                      <>
                        <TableCell>{renderVerificationBadge(record)}</TableCell>
                        <TableCell>
                          {renderConfidenceScore(record.face_verification_confidence)}
                        </TableCell>
                      </>
                    )}
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleRowExpansion(record.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" /> Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" /> View
                          </>
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>

                  {/* Expanded row details */}
                  {isExpanded && (
                    <TableRow>
                      <TableCell colSpan={showVerificationDetails ? 7 : 5} className="bg-gray-50">
                        <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {record.check_in_time && (
                            <article>
                              <dt className="text-xs font-medium text-gray-500">Check-in Time</dt>
                              <dd className="text-sm text-gray-900 mt-1">
                                <time dateTime={record.check_in_time}>
                                  {new Date(record.check_in_time).toLocaleTimeString()}
                                </time>
                              </dd>
                            </article>
                          )}
                          {record.check_out_time && (
                            <article>
                              <dt className="text-xs font-medium text-gray-500">Check-out Time</dt>
                              <dd className="text-sm text-gray-900 mt-1">
                                <time dateTime={record.check_out_time}>
                                  {new Date(record.check_out_time).toLocaleTimeString()}
                                </time>
                              </dd>
                            </article>
                          )}
                          {record.hours_worked !== undefined && record.hours_worked !== null && (
                            <article>
                              <dt className="text-xs font-medium text-gray-500">Hours Worked</dt>
                              <dd className="text-sm text-gray-900 mt-1">
                                <data value={record.hours_worked}>
                                  {record.hours_worked.toFixed(2)} hours
                                </data>
                              </dd>
                            </article>
                          )}

                          {/* Verification photo */}
                          {record.verification_photo_url && (
                            <article>
                              <dt className="text-xs font-medium text-gray-500 mb-2">
                                Verification Photo
                              </dt>
                              <dd>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setSelectedPhoto(record.verification_photo_url!)}
                                >
                                  <ImageIcon className="w-4 h-4 mr-2" />
                                  View Photo
                                </Button>
                              </dd>
                            </article>
                          )}

                          {/* Notes */}
                          {record.notes && (
                            <article className="col-span-2">
                              <dt className="text-xs font-medium text-gray-500">Notes</dt>
                              <dd className="text-sm text-gray-900 mt-1">{record.notes}</dd>
                            </article>
                          )}
                        </dl>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </section>

      {/* Photo Modal */}
      <Dialog open={!!selectedPhoto} onOpenChange={(open) => !open && setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Verification Photo</DialogTitle>
          </DialogHeader>
          <figure className="m-0">
            {selectedPhoto && (
              <img
                src={selectedPhoto}
                alt="Verification"
                className="max-w-full max-h-[70vh] rounded-lg mx-auto"
              />
            )}
          </figure>
        </DialogContent>
      </Dialog>
    </>
  );
}
