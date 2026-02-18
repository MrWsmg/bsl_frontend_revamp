"use client";

import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, X, RefreshCw, Check, Loader2, Package, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import { useApi } from '@/hooks';
import apiService from '@/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { PendingIssuance } from '@/types/farm-clerk';

interface DispatchPhotoUploadProps {
  onUploadComplete?: () => void;
}

export const DispatchPhotoUpload: React.FC<DispatchPhotoUploadProps> = ({ onUploadComplete }) => {
  const [selectedIssuance, setSelectedIssuance] = useState<PendingIssuance | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getPendingIssuances = useCallback(() => apiService.getPendingIssuances(), []);
  const { data: issuances, loading, refetch } = useApi<PendingIssuance[]>(getPendingIssuances);

  // Filter to only show confirmed issuances (ready for dispatch photo)
  const confirmedIssuances = (issuances || []).filter((i) => i.status === 'confirmed');

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: 1280, height: 720 },
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
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0);
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedImage(imageData);
        setUploadedFile(null);
        stopCamera();
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }
      setUploadedFile(file);

      // Preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setCapturedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetImage = () => {
    setCapturedImage(null);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async () => {
    if (!selectedIssuance || (!capturedImage && !uploadedFile)) {
      toast.error('Please select an issuance and capture/upload a photo');
      return;
    }

    setUploading(true);
    try {
      let file: File;

      if (uploadedFile) {
        file = uploadedFile;
      } else if (capturedImage) {
        const response = await fetch(capturedImage);
        const blob = await response.blob();
        file = new File([blob], 'dispatch.jpg', { type: 'image/jpeg' });
      } else {
        throw new Error('No image to upload');
      }

      await apiService.uploadDispatchPhoto(selectedIssuance.id, file);

      setShowSuccessDialog(true);
      resetForm();
      refetch();
      onUploadComplete?.();
      toast.success('Dispatch photo uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload dispatch photo');
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedIssuance(null);
    resetImage();
    stopCamera();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Select Issuance */}
      <Card>
        <CardHeader>
          <CardTitle>Select Issuance for Dispatch</CardTitle>
          <CardDescription>Choose a confirmed issuance to upload dispatch photo</CardDescription>
        </CardHeader>
        <CardContent>
          {confirmedIssuances.length === 0 ? (
            <div className="text-center py-8 bg-muted/50 rounded-lg">
              <Package className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-muted-foreground">No confirmed issuances awaiting dispatch</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {confirmedIssuances.map((issuance) => (
                <button
                  key={issuance.id}
                  type="button"
                  onClick={() => setSelectedIssuance(issuance)}
                  className={`w-full p-4 rounded-lg border text-left transition-all ${
                    selectedIssuance?.id === issuance.id
                      ? 'border-primary ring-2 ring-primary/20 bg-primary/5'
                      : 'hover:border-muted-foreground/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 p-2 rounded-lg">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{issuance.item_name}</p>
                        <p className="text-sm text-muted-foreground">
                          {issuance.quantity} {issuance.unit} • {issuance.requester_name}
                        </p>
                      </div>
                    </div>
                    <Badge variant="default">Confirmed</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Photo Capture/Upload */}
      {selectedIssuance && (
        <Card>
          <CardHeader>
            <CardTitle>Dispatch Photo</CardTitle>
            <CardDescription>
              Capture or upload a photo with the gate pass for {selectedIssuance.item_name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Photo preview area */}
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
                  alt="Dispatch"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <FileImage className="h-12 w-12 text-muted-foreground" />
                  <p className="mt-2 text-sm text-muted-foreground">No photo selected</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              {!cameraActive && !capturedImage && (
                <>
                  <Button onClick={startCamera} variant="outline" className="flex-1">
                    <Camera className="mr-2 h-4 w-4" />
                    Use Camera
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Upload File
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </>
              )}

              {cameraActive && (
                <>
                  <Button onClick={capturePhoto} className="flex-1">
                    <Camera className="mr-2 h-4 w-4" />
                    Capture
                  </Button>
                  <Button variant="outline" onClick={stopCamera}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}

              {capturedImage && !cameraActive && (
                <>
                  <Button variant="outline" onClick={resetImage} className="flex-1">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retake
                  </Button>
                  <Button onClick={handleUpload} disabled={uploading} className="flex-1">
                    {uploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Upload & Complete
                  </Button>
                </>
              )}
            </div>

            <p className="text-xs text-muted-foreground text-center">
              Please include the gate pass number in the photo for verification
            </p>
          </CardContent>
        </Card>
      )}

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Dispatch Photo Uploaded
            </DialogTitle>
            <DialogDescription>
              The dispatch photo has been uploaded successfully. The issuance is now marked as dispatched.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowSuccessDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DispatchPhotoUpload;
