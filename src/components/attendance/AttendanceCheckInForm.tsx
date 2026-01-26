"use client";

import { useState, useEffect } from 'react';
import { UserCheck, Users, Camera, AlertCircle, CheckCircle } from 'lucide-react';
import { Worker, Farm } from '../../types';
import apiService from '../../services/api';
import { toast } from 'sonner';
import { FaceVerificationCapture } from './FaceVerificationCapture';

interface AttendanceCheckInFormProps {
  workers: Worker[];
  farms: Farm[];
  onCheckInSuccess?: () => void;
}

export function AttendanceCheckInForm({
  workers,
  farms,
  onCheckInSuccess
}: AttendanceCheckInFormProps) {
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedFarm, setSelectedFarm] = useState<Farm | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    status: 'verified' | 'failed' | null;
    confidence?: number;
    message?: string;
  }>({ status: null });

  // Auto-select farm if only one
  useEffect(() => {
    if (farms.length === 1) {
      setSelectedFarm(farms[0]);
    }
  }, [farms]);

  // Filter workers
  const filteredWorkers = workers.filter((worker) => {
    const query = searchQuery.toLowerCase();
    return (
      worker.name?.toLowerCase().includes(query) ||
      worker.full_name?.toLowerCase().includes(query) ||
      worker.id.toString().includes(searchQuery)
    );
  });

  // Handle worker selection
  const handleWorkerSelect = (worker: Worker) => {
    setSelectedWorker(worker);
    setSearchQuery('');
    setShowCamera(false);
    setVerificationResult({ status: null });
  };

  // Handle photo capture
  const handlePhotoCapture = async (file: File) => {
    if (!selectedWorker || !selectedFarm) {
      toast.error('Please select worker and farm');
      return;
    }

    setIsProcessing(true);
    setVerificationResult({ status: null });

    try {
      const result = await apiService.attendance.checkInWithFaceVerification({
        worker_id: selectedWorker.id,
        farm_id: selectedFarm.id,
        file,
        status: 'present'
      });

      if (result.success) {
        if (result.face_verification_status === 'verified') {
          setVerificationResult({
            status: 'verified',
            confidence: result.confidence,
            message: result.message
          });
          toast.success(`Check-in successful! ${result.worker_name} verified.`);
        } else if (result.face_verification_status === 'failed') {
          setVerificationResult({
            status: 'failed',
            message: result.message
          });
          toast.warning('Face verification failed. Recorded as manual check-in.');
        } else {
          // Manual check-in
          toast.success(`Check-in successful! Recorded manually.`);
        }

        // Reset form after success
        setTimeout(() => {
          setSelectedWorker(null);
          setShowCamera(false);
          setVerificationResult({ status: null });
          onCheckInSuccess?.();
        }, 2000);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Check-in failed';

      toast.error(errorMessage);
      setVerificationResult({
        status: 'failed',
        message: errorMessage
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle manual check-in
  const handleManualCheckIn = async () => {
    if (!selectedWorker || !selectedFarm) {
      toast.error('Please select worker and farm');
      return;
    }

    try {
      setIsProcessing(true);
      await apiService.attendance.manualCheckIn({
        worker_id: selectedWorker.id,
        farm_id: selectedFarm.id,
        status: 'present'
      });

      toast.success('Manual check-in successful!');
      setSelectedWorker(null);
      setShowCamera(false);
      onCheckInSuccess?.();
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Manual check-in failed';

      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <UserCheck className="w-6 h-6 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Attendance Check-In</h2>
          <p className="text-sm text-gray-600">Record worker attendance with face verification</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Farm Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Farm
          </label>
          <select
            value={selectedFarm?.id || ''}
            onChange={(e) => {
              const farm = farms.find((f) => f.id === Number(e.target.value));
              setSelectedFarm(farm || null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Choose a farm...</option>
            {farms.map((farm, index) => (
              <option key={farm.id ?? `farm-${index}`} value={farm.id}>
                {farm.name} - {farm.location}
              </option>
            ))}
          </select>
        </div>

        {/* Worker Selection */}
        {!selectedWorker ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Worker
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <Users className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
            </div>

            {searchQuery && (
              <div className="mt-2 border border-gray-300 rounded-lg max-h-64 overflow-y-auto">
                {filteredWorkers.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-sm">
                    No workers found
                  </div>
                ) : (
                  filteredWorkers.map((worker) => (
                    <button
                      key={worker.id}
                      onClick={() => handleWorkerSelect(worker)}
                      className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b last:border-b-0 text-left"
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                          worker.face_id ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      >
                        {worker.name?.charAt(0) || 'W'}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">
                          {worker.full_name || worker.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          ID: {worker.id} • {worker.worker_type}
                          {worker.face_id ? ' • Face Registered ✓' : ' • No Face Registered'}
                        </p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Selected Worker Card */}
            <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {selectedWorker.name?.charAt(0) || 'W'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {selectedWorker.full_name || selectedWorker.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      ID: {selectedWorker.id} • {selectedWorker.worker_type}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedWorker(null);
                    setShowCamera(false);
                    setVerificationResult({ status: null });
                  }}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={isProcessing}
                >
                  Change
                </button>
              </div>

              {!selectedWorker.face_id && (
                <div className="bg-yellow-50 border border-yellow-200 rounded p-3 flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-yellow-800">
                    <p className="font-medium">No face registered for this worker</p>
                    <p className="text-xs mt-1">
                      Check-in will be recorded as manual. Upload a worker photo to enable face verification.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Face Verification or Manual Check-in */}
            {!showCamera ? (
              <div className="space-y-3">
                {selectedFarm && (
                  <div className="text-center space-y-3">
                    <button
                      onClick={() => setShowCamera(true)}
                      disabled={!selectedFarm}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-lg font-medium"
                    >
                      <Camera className="w-6 h-6" />
                      Start Face Verification
                    </button>

                    <button
                      onClick={handleManualCheckIn}
                      disabled={isProcessing}
                      className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
                    >
                      Manual Check-In (No Photo)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <FaceVerificationCapture
                worker={selectedWorker}
                onCapture={handlePhotoCapture}
                onCancel={() => setShowCamera(false)}
                isProcessing={isProcessing}
                verificationResult={verificationResult}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
