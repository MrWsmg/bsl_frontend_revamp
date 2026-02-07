"use client";

import { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, Camera, User, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Worker } from '../../types';
import apiService from '../../services/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';

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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Upload Worker Photo</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Register worker faces for attendance verification
          </p>
        </DialogHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleUpload(); }} className="space-y-6">
          {/* Worker Selection */}
          <fieldset>
            <legend className="block text-sm font-medium text-gray-700 mb-2">
              Select Worker
            </legend>
            <Input
              type="text"
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
            />
            <ul className="border border-gray-200 rounded-lg max-h-48 overflow-y-auto list-none m-0 p-0">
              {filteredWorkers.length === 0 ? (
                <li className="p-4 text-center text-gray-500 text-sm">
                  No workers found
                </li>
              ) : (
                filteredWorkers.map((worker) => (
                  <li key={worker.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedWorker(worker)}
                      className={`w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                        selectedWorker?.id === worker.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <figure
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold m-0 ${
                          worker.face_id ? 'bg-green-500' : 'bg-gray-400'
                        }`}
                      >
                        {worker.face_id ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </figure>
                      <span className="text-left flex-1">
                        <strong className="block font-medium text-gray-900">
                          {worker.full_name || worker.name}
                        </strong>
                        <small className="text-xs text-gray-500">
                          ID: {worker.id} • {worker.worker_type}
                          {worker.face_id && ' • Face Registered'}
                        </small>
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </fieldset>

          {/* Photo Upload */}
          {selectedWorker && (
            <fieldset>
              <legend className="block text-sm font-medium text-gray-700 mb-2">
                Upload Photo
              </legend>

              {!previewUrl ? (
                <section className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                  <article className="text-center space-y-4">
                    <Camera className="w-16 h-16 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600 mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, WEBP up to 10MB
                    </p>
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Choose File
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </article>
                </section>
              ) : (
                <section className="space-y-4">
                  <figure className="relative border border-gray-200 rounded-lg overflow-hidden m-0">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="w-full h-64 object-contain bg-gray-50"
                    />
                    {uploadSuccess && (
                      <figcaption className="absolute inset-0 bg-green-500 bg-opacity-90 flex items-center justify-center">
                        <span className="text-white text-center">
                          <CheckCircle className="w-16 h-16 mx-auto mb-2" />
                          <strong className="font-semibold">Upload Successful!</strong>
                        </span>
                      </figcaption>
                    )}
                  </figure>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (previewUrl) {
                        URL.revokeObjectURL(previewUrl);
                      }
                      setPreviewUrl(null);
                      setSelectedFile(null);
                    }}
                    disabled={isUploading}
                  >
                    Choose different photo
                  </Button>
                </section>
              )}

              {/* Photo Guidelines */}
              <aside className="mt-4 bg-blue-50 rounded-lg p-4">
                <header className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <article>
                    <h4 className="font-medium text-blue-900 text-sm mb-2">
                      Photo Requirements:
                    </h4>
                    <ul className="text-xs text-blue-700 space-y-1 list-none m-0 p-0">
                      <li>• Clear, front-facing photo of the worker</li>
                      <li>• Good lighting with no shadows on face</li>
                      <li>• No hats, sunglasses, or face coverings</li>
                      <li>• Only one person in the photo</li>
                      <li>• High resolution for better accuracy</li>
                    </ul>
                  </article>
                </header>
              </aside>
            </fieldset>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isUploading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!selectedWorker || !selectedFile || isUploading || uploadSuccess}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Photo
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
