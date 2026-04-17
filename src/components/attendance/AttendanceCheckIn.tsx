"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Camera, User, UserCheck, Clock, Loader2, Check, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import apiService from '@/services/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { WorkerSelector } from './WorkerSelector';
import type { Worker, Farm } from '@/types';
import type { AttendanceCreate, CheckInResponse } from '@/types/farm-clerk';

interface AttendanceCheckInProps {
  farms: Farm[];
}

type CheckInMode = 'camera' | 'manual';

export const AttendanceCheckIn: React.FC<AttendanceCheckInProps> = ({ farms }) => {
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [checkInMode, setCheckInMode] = useState<CheckInMode>('manual');
  const [status, setStatus] = useState<string>('present');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<CheckInResponse | null>(null);

  // Camera state
  const [cameraActive, setCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setCameraActive(true);
      }
    } catch (error) {
      toast.error('Failed to access camera. Please check permissions.');
      console.error('Camera error:', error);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
    setCapturedImage(null);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(imageData);
        stopCamera();
      }
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleManualCheckIn = async () => {
    if (!selectedWorker || !selectedFarmId) {
      toast.error('Please select a worker and farm');
      return;
    }

    setLoading(true);
    try {
      const data: AttendanceCreate = {
        farm_id: parseInt(selectedFarmId),
        worker_id: selectedWorker.id,
        date: new Date().toISOString().split('T')[0],
        status: status as 'present' | 'absent' | 'half_day' | 'leave' | 'sick',
        check_in_time: new Date().toISOString(),
        notes: notes || undefined,
      };

      await apiService.attendance.manualCheckIn(data);

      setLastCheckIn({
        success: true,
        message: 'Check-in successful',
        attendance_id: 0,
        worker_name: selectedWorker.name,
        verification_status: 'manual',
      });
      setShowSuccessDialog(true);
      resetForm();
      toast.success(`${selectedWorker.name} checked in successfully`);
    } catch (error) {
      toast.error('Failed to record attendance');
      console.error('Check-in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFaceCheckIn = async () => {
    if (!selectedWorker || !selectedFarmId || !capturedImage) {
      toast.error('Please complete all required fields');
      return;
    }

    setLoading(true);
    try {
      // Convert base64 to blob
      const response = await fetch(capturedImage);
      const blob = await response.blob();
      const file = new File([blob], 'checkin.jpg', { type: blob.type || 'image/jpeg' });

      const result = await apiService.attendance.checkInWithFaceVerification({
        worker_id: selectedWorker.id,
        farm_id: parseInt(selectedFarmId),
        file,
      });

      setLastCheckIn({
        success: result.success,
        message: result.message,
        attendance_id: result.attendance_id,
        confidence: result.confidence,
        worker_name: result.worker_name,
        verification_status: result.face_verification_status,
      });
      setShowSuccessDialog(true);

      if (result.success) {
        resetForm();
        toast.success(`${result.worker_name || selectedWorker.name} verified and checked in`);
      } else {
        toast.warning(result.message || 'Verification failed, manual check-in recorded');
      }
    } catch (error) {
      toast.error('Failed to process face verification');
      console.error('Face check-in error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = useCallback(() => {
    setSelectedWorker(null);
    setStatus('present');
    setNotes('');
    setCapturedImage(null);
    stopCamera();
  }, []);

  return (
    <div className="space-y-6">
      {/* Mode Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          className={`cursor-pointer transition-all ${
            checkInMode === 'manual' ? 'border-primary ring-2 ring-primary/20' : ''
          }`}
          onClick={() => {
            setCheckInMode('manual');
            stopCamera();
          }}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-blue-500 p-3 rounded-xl">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Manual Check-In</h3>
                <p className="text-sm text-muted-foreground">Record attendance manually</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            checkInMode === 'camera' ? 'border-primary ring-2 ring-primary/20' : ''
          }`}
          onClick={() => setCheckInMode('camera')}
        >
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="bg-green-500 p-3 rounded-xl">
                <Camera className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-semibold">Face Verification</h3>
                <p className="text-sm text-muted-foreground">Check-in with photo verification</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Worker Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Worker</CardTitle>
            <CardDescription>Choose a worker to check in</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label>Farm</Label>
                <Select value={selectedFarmId} onValueChange={setSelectedFarmId}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select Farm" />
                  </SelectTrigger>
                  <SelectContent>
                    {farms.map((farm) => (
                      <SelectItem key={farm.id} value={farm.id.toString()}>
                        {farm.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedFarmId && (
                <WorkerSelector
                  selectedWorkerId={selectedWorker?.id}
                  onSelect={setSelectedWorker}
                  farmId={parseInt(selectedFarmId)}
                />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Check-In Form */}
        <Card>
          <CardHeader>
            <CardTitle>
              {checkInMode === 'camera' ? 'Face Verification' : 'Manual Check-In'}
            </CardTitle>
            <CardDescription>
              {checkInMode === 'camera'
                ? 'Take a photo for face verification'
                : 'Record attendance status'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {checkInMode === 'camera' ? (
              <div className="space-y-4">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden relative">
                  {cameraActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover"
                    />
                  ) : capturedImage ? (
                    <img
                      src={capturedImage}
                      alt="Captured"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <Camera className="h-12 w-12 text-muted-foreground" />
                      <p className="mt-2 text-sm text-muted-foreground">Camera preview</p>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {!cameraActive && !capturedImage && (
                    <Button onClick={startCamera} className="flex-1">
                      <Camera className="mr-2 h-4 w-4" />
                      Start Camera
                    </Button>
                  )}
                  {cameraActive && (
                    <>
                      <Button onClick={capturePhoto} className="flex-1">
                        <Camera className="mr-2 h-4 w-4" />
                        Capture Photo
                      </Button>
                      <Button variant="outline" onClick={stopCamera}>
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                  {capturedImage && (
                    <>
                      <Button variant="outline" onClick={retakePhoto} className="flex-1">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retake
                      </Button>
                      <Button
                        onClick={handleFaceCheckIn}
                        disabled={loading || !selectedWorker}
                        className="flex-1"
                      >
                        {loading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="mr-2 h-4 w-4" />
                        )}
                        Verify & Check In
                      </Button>
                    </>
                  )}
                </div>

                {selectedWorker?.face_id ? (
                  <Badge variant="default" className="w-full justify-center py-1">
                    <UserCheck className="mr-2 h-4 w-4" />
                    Face ID registered for this worker
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="w-full justify-center py-1">
                    No Face ID registered - will record manually
                  </Badge>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <Label>Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="present">Present</SelectItem>
                      <SelectItem value="absent">Absent</SelectItem>
                      <SelectItem value="half_day">Half Day</SelectItem>
                      <SelectItem value="leave">On Leave</SelectItem>
                      <SelectItem value="sick">Sick</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Notes (Optional)</Label>
                  <Textarea
                    placeholder="Add any notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Check-in time: {new Date().toLocaleTimeString()}</span>
                </div>

                <Button
                  onClick={handleManualCheckIn}
                  disabled={loading || !selectedWorker || !selectedFarmId}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <UserCheck className="mr-2 h-4 w-4" />
                  )}
                  Record Attendance
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Check-In Successful
            </DialogTitle>
            <DialogDescription>
              Attendance has been recorded successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {lastCheckIn && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Worker:</span>
                  <span className="font-medium">{lastCheckIn.worker_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Verification:</span>
                  <Badge
                    variant={lastCheckIn.verification_status === 'verified' ? 'default' : 'secondary'}
                  >
                    {lastCheckIn.verification_status}
                  </Badge>
                </div>
                {lastCheckIn.confidence !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className="font-medium">{(lastCheckIn.confidence * 100).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AttendanceCheckIn;
