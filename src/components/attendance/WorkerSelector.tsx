"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { Search, User, Check } from 'lucide-react';
import { useApi } from '@/hooks';
import apiService from '@/services/api';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';
import type { Worker } from '@/types';

interface WorkerSelectorProps {
  selectedWorkerId?: number;
  onSelect: (worker: Worker) => void;
  farmId?: number;
}

export const WorkerSelector: React.FC<WorkerSelectorProps> = ({
  selectedWorkerId,
  onSelect,
  farmId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const getWorkers = useCallback(() => apiService.getWorkers(), []);
  const { data: workers, loading } = useApi<Worker[]>(getWorkers);

  const filteredWorkers = useMemo(() => {
    if (!workers) return [];

    let filtered = workers;

    // Filter by farm if farmId is provided
    if (farmId) {
      filtered = filtered.filter((worker) => {
        const assignments = worker.farm_assignments?.split(',').map(id => parseInt(id.trim())) || [];
        return assignments.includes(farmId);
      });
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((worker) =>
        worker.name.toLowerCase().includes(query) ||
        worker.full_name?.toLowerCase().includes(query) ||
        worker.phone?.includes(query)
      );
    }

    return filtered;
  }, [workers, farmId, searchQuery]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <LoadingSpinner size="md" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search workers by name or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <ScrollArea className="h-[300px] rounded-md border">
        {filteredWorkers.length === 0 ? (
          <div className="text-center py-8">
            <User className="mx-auto h-12 w-12 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery ? 'No workers found matching your search' : 'No workers available'}
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {filteredWorkers.map((worker) => (
              <button
                key={worker.id}
                type="button"
                onClick={() => onSelect(worker)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left ${
                  selectedWorkerId === worker.id
                    ? 'bg-primary/10 border-2 border-primary'
                    : 'hover:bg-muted border-2 border-transparent'
                }`}
              >
                <Avatar className="h-10 w-10">
                  {worker.photo_url ? (
                    <AvatarImage src={worker.photo_url} alt={worker.name} />
                  ) : null}
                  <AvatarFallback>{getInitials(worker.name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{worker.name}</p>
                    {worker.face_id && (
                      <Badge variant="outline" className="text-xs">
                        Face ID
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="capitalize">{worker.worker_type}</span>
                    {worker.phone && <span>• {worker.phone}</span>}
                  </div>
                </div>
                {selectedWorkerId === worker.id && (
                  <Check className="h-5 w-5 text-primary flex-shrink-0" />
                )}
              </button>
            ))}
          </div>
        )}
      </ScrollArea>

      {filteredWorkers.length > 0 && (
        <p className="text-xs text-muted-foreground text-center">
          {filteredWorkers.length} worker{filteredWorkers.length !== 1 ? 's' : ''} found
        </p>
      )}
    </div>
  );
};

export default WorkerSelector;
