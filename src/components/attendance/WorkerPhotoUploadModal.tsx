"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { X, Upload, Camera, User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Worker } from '../../types';
import apiService from '../../services/api';
import { toast } from 'sonner';

interface WorkerPhotoUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  workers: Worker[];
  onPhotoUploaded?: (workerId: number) => void;
}

export function WorkerPhotoUploadModal({
  isOpen,
  onClose,
  workers,
  onPhotoUploaded
}: WorkerPhotoUploadModalProps) {
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup preview URL on unmount or file change
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedWorker(null);
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setUploadSuccess(false);
      setSearchQuery('');
    }
  }, [isOpen, previewUrl]);

  // Handle file selection
  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('File size must be less than 10MB');
      return;
    }

    // Cleanup old preview
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  }, [previewUrl]);

  // Handle file input change
  const handleFileInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedWorker || !selectedFile) {
      toast.error('Please select a worker and photo');
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);

    try {
      const response = await apiService.photos.uploadWorkerPhoto({
        file: selectedFile,
        workerId: selectedWorker.id
      });

      if (response.success) {
        toast.success(
          response.face_indexed
            ? 'Photo uploaded and face indexed successfully!'
            : 'Photo uploaded successfully!'
        );
        setUploadSuccess(true);
        onPhotoUploaded?.(selectedWorker.id);

        // Auto-close after 1.5 seconds on success
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error: any) {
      const errorMessage =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        error?.message ||
        'Failed to upload photo';

      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  };

  // Filter workers by search query
  const filteredWorkers = workers.filter((worker) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      worker.name?.toLowerCase().includes(searchLower) ||
      worker.full_name?.toLowerCase().includes(searchLower) ||
      worker.id.toString().includes(searchQuery)
    );
  });

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Upload Worker Photo</h2>
            <p className="text-sm text-gray-600 mt-1">
              Register worker faces for attendance verification
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={isUploading}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Worker Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Worker
            </label>
            <input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
            />
            <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
              {filteredWorkers.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  No workers found
                </div>
              ) : (
                filteredWorkers.map((worker) => (
                  <button
                    key={worker.id}
                    onClick={() => setSelectedWorker(worker)}
                    className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                      selectedWorker?.id === worker.id ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                        worker.face_id ? 'bg-green-500' : 'bg-gray-400'
                      }`}
                    >
                      {worker.face_id ? (
                        <CheckCircle className="w-5 h-5" />
                      ) : (
                        <User className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-left flex-1">
                      <p className="font-medium text-gray-900">
                        {worker.full_name || worker.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        ID: {worker.id} • {worker.worker_type}
                        {worker.face_id && ' • Face Registered'}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Photo Upload */}
          {selectedWorker && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Photo
              </label>

              {!previewUrl ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <div className="text-center space-y-4">
                    <Camera className="w-16 h-16 text-gray-400 mx-auto" />
                    <div>
                      <p className="text-sm text-gray-600 mb-2">
                        Click to upload or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">
                        PNG, JPG, WEBP up to 10MB
                      </p>
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Choose File
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative border border-gray-300 rounded-lg overflow-hidden">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-64 object-contain bg-gray-50"
                    />
                    {uploadSuccess && (
                      <div className="absolute inset-0 bg-green-500 bg-opacity-90 flex items-center justify-center">
                        <div className="text-white text-center">
                          <CheckCircle className="w-16 h-16 mx-auto mb-2" />
                          <p className="font-semibold">Upload Successful!</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                      }
                      setPreviewUrl(null);
                      setSelectedFile(null);
                    }}
                    className="text-sm text-gray-600 hover:text-gray-900"
                    disabled={isUploading}
                  >
                    Choose different photo
                  </button>
                </div>
              )}

              {/* Photo Guidelines */}
              <div className="mt-4 bg-blue-50 rounded-lg p-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-blue-900 text-sm mb-2">
                      Photo Requirements:
                    </h4>
                    <ul className="text-xs text-blue-700 space-y-1">
                      <li>• Clear, front-facing photo of the worker</li>
                      <li>• Good lighting with no shadows on face</li>
                      <li>• No hats, sunglasses, or face coverings</li>
                      <li>• Only one person in the photo</li>
                      <li>• High resolution for better accuracy</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 justify-end p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedWorker || !selectedFile || isUploading || uploadSuccess}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Photo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
