"use client";

// Header component
import React, { useState } from 'react';
import { User, LogOut, Menu, Camera } from 'lucide-react';
import { User as UserType } from '../../types';
import PhotoCaptureModal from '../photos/PhotoCaptureModal';

interface HeaderProps {
  user: UserType;
  onLogout: () => void;
  title?: string;
  onMenuClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  user, 
  onLogout, 
  title = "AGENTIC Farm Tracking",
  onMenuClick 
}) => {
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 mr-3"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-lg sm:text-xl font-bold text-gray-800 truncate">{title}</h1>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <div className="hidden sm:flex items-center text-gray-700">
              <User className="w-5 h-5 mr-2" />
              <span className="hidden md:inline">{user.full_name}</span>
            </div>
            <div className="sm:hidden flex items-center text-gray-700">
              <User className="w-5 h-5" />
            </div>
            <button
              onClick={() => setShowPhotoModal(true)}
              className="hidden sm:inline-flex items-center bg-blue-100 text-blue-700 px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors"
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture Photo/ID
            </button>
            <button
              onClick={() => setShowPhotoModal(true)}
              className="sm:hidden p-2 rounded-md text-blue-600 hover:bg-blue-50"
              aria-label="Capture Photo"
            >
              <Camera className="w-5 h-5" />
            </button>
            <button
              onClick={onLogout}
              className="bg-red-500 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-md flex items-center text-sm sm:text-base"
            >
              <LogOut className="w-4 h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>

      <PhotoCaptureModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        currentUser={user}
      />
    </nav>
  );
};
