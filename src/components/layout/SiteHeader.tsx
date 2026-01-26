"use client";

import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { User } from '@/types';
import PhotoCaptureModal from '../photos/PhotoCaptureModal';

interface SiteHeaderProps {
  title?: string;
  user: User;
}

export function SiteHeader({ title = 'Dashboard', user }: SiteHeaderProps) {
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-50 bg-background flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{title}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div className="ml-auto flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPhotoModal(true)}
            className="hidden sm:flex"
          >
            <Camera className="mr-2 h-4 w-4" />
            Capture Photo
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowPhotoModal(true)}
            className="sm:hidden"
          >
            <Camera className="h-4 w-4" />
          </Button>
        </div>
      </header>

      <PhotoCaptureModal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        currentUser={user}
      />
    </>
  );
}
