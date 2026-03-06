"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Worker } from '../../types';

interface FaceVerificationCaptureProps {
  worker: Worker;
  onCapture: (file: File) => void;
  onCancel: () => void;
  isProcessing?: boolean;
  verificationResult?: {
    status: 'verified' | 'failed' | null;
    confidence?: number;
    message?: string;
  };
}

export function FaceVerificationCapture({
  worker,
  onCapture,
  onCancel,
  isProcessing = false,
  verificationResult
}: FaceVerificationCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Connect stream to video element once both are available
  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, isCameraActive]);

  // Start camera
  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 1280, height: 720 }
      });
      // Set state first — the useEffect above will assign srcObject after the
      // <video> element renders (videoRef.current was null before isCameraActive=true)
      setCameraStream(stream);
      setIsCameraActive(true);
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Unable to access camera. Please check permissions or use file upload.');
    }
  }, []);

  // Stop camera
  const stopCamera = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setIsCameraActive(false);
    }
  }, [cameraStream]);

  // Capture photo from camera
  const capturePhoto = useCallback(() => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');

    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `verification-${worker.id}-${Date.now()}.jpg`, {
            type: 'image/jpeg'
          });

          const imageUrl = URL.createObjectURL(blob);
          setCapturedImage(imageUrl);
          stopCamera();
          onCapture(file);
        }
      }, 'image/jpeg', 0.95);
    }
  }, [worker.id, stopCamera, onCapture]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const imageUrl = URL.createObjectURL(file);
      setCapturedImage(imageUrl);
      onCapture(file);
    }
  }, [onCapture]);

  // Retake photo
  const retakePhoto = useCallback(() => {
    if (capturedImage) {
      URL.revokeObjectURL(capturedImage);
    }
    setCapturedImage(null);
    startCamera();
  }, [capturedImage, startCamera]);

  // Render verification status
  const renderVerificationStatus = () => {
    if (!verificationResult) return null;

    if (verificationResult.status === 'verified') {
      return (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-green-900">Face Verified Successfully</h4>
              <p className="text-sm text-green-700 mt-1">
                {verificationResult.message}
              </p>
              {verificationResult.confidence && (
                <div className="mt-2">
                  <p className="text-xs text-green-600 mb-1">
                    Confidence: {verificationResult.confidence.toFixed(1)}%
                  </p>
                  <div className="w-full bg-green-200 rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{ width: `${verificationResult.confidence}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    if (verificationResult.status === 'failed') {
      return (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start gap-3">
            <XCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-yellow-900">Face Verification Failed</h4>
              <p className="text-sm text-yellow-700 mt-1">
                {verificationResult.message || 'Face could not be verified'}
              </p>
              <button
                onClick={retakePhoto}
                className="mt-3 text-sm text-yellow-700 hover:text-yellow-900 font-medium flex items-center gap-1"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Worker Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
            {worker.name?.charAt(0) || worker.full_name?.charAt(0) || 'W'}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {worker.full_name || worker.name}
            </h3>
            <p className="text-sm text-gray-600">
              {worker.worker_type === 'permanent' ? 'Permanent Worker' : 'Contract Worker'}
            </p>
            {!worker.face_id && (
              <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                No face registered - will record as manual check-in
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Photo Capture Area */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
        {!capturedImage && !isCameraActive && (
          <div className="text-center space-y-4">
            <Camera className="w-16 h-16 text-gray-400 mx-auto" />
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Capture Verification Photo</h4>
              <p className="text-sm text-gray-600 mb-4">
                Take a clear photo of the worker's face for attendance verification
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={startCamera}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Open Camera
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Upload Photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>
        )}

        {isCameraActive && !capturedImage && (
          <div className="space-y-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full rounded-lg bg-black"
            />
            <div className="flex gap-3 justify-center">
              <button
                onClick={capturePhoto}
                disabled={isProcessing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                <Camera className="w-5 h-5" />
                Capture Photo
              </button>
              <button
                onClick={() => {
                  stopCamera();
                  onCancel();
                }}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {capturedImage && (
          <div className="space-y-4">
            <div className="relative">
              <img
                src={capturedImage}
                alt="Captured verification"
                crossOrigin="anonymous"
                className="w-full rounded-lg"
              />
              {isProcessing && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="text-white text-center">
                    <Loader2 className="w-12 h-12 animate-spin mx-auto mb-2" />
                    <p className="text-sm">Verifying face...</p>
                  </div>
                </div>
              )}
            </div>

            {!isProcessing && !verificationResult && (
              <div className="flex gap-3 justify-center">
                <button
                  onClick={retakePhoto}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-5 h-5" />
                  Retake
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Verification Status */}
      {renderVerificationStatus()}

      {/* Photo Guidelines */}
      {!capturedImage && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2 text-sm">Photo Guidelines:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Ensure good lighting</li>
            <li>• Face should be clearly visible</li>
            <li>• Remove hats, sunglasses, or face coverings</li>
            <li>• Only one person in the photo</li>
            <li>• Look directly at the camera</li>
          </ul>
        </div>
      )}
    </div>
  );
}
