"use client";

import React, { useState, useCallback } from 'react';
import { useApi } from '../../../hooks';
import apiService from '../../../services/api';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Calendar, Plus, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const GmMeetingsSection: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    scheduled_date: '',
    scheduled_time: '',
    location: '',
    agenda: '',
    attendees: '',
  });

  const fetch = useCallback(() => apiService.getGmMeetings(), []);
  const { data: raw, loading, error, refetch } = useApi<any>(fetch);
  const meetings: any[] = Array.isArray(raw)
    ? raw
    : (raw as any)?.meetings ?? (raw as any)?.data ?? [];

  const handleChange = (field: keyof typeof form, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.title || !form.scheduled_date) {
      toast.error('Title and date are required');
      return;
    }
    setSubmitting(true);
    try {
      await apiService.postGmMeeting({
        title:          form.title,
        scheduled_date: form.scheduled_date,
        scheduled_time: form.scheduled_time || undefined,
        location:       form.location       || undefined,
        agenda:         form.agenda         || undefined,
        attendees:      form.attendees
          ? form.attendees.split(',').map(s => s.trim()).filter(Boolean)
          : undefined,
      });
      toast.success('Meeting scheduled');
      setShowForm(false);
      setForm({ title: '', scheduled_date: '', scheduled_time: '', location: '', agenda: '', attendees: '' });
      refetch();
    } catch (err: any) {
      toast.error(err?.message ?? 'Failed to schedule meeting');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColor = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed': return 'bg-success/20 text-success';
      case 'cancelled': return 'bg-destructive/20 text-destructive';
      case 'scheduled': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
      default:          return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Meetings</h2>
          <p className="text-sm text-muted-foreground">Schedule meetings with Farm Managers</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" /> Schedule Meeting
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded p-3 text-sm text-destructive">
          <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary" /> Scheduled Meetings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><LoadingSpinner size="lg" /></div>
          ) : meetings.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">No meetings scheduled yet</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => setShowForm(true)}>
                <Plus className="w-4 h-4 mr-1" /> Schedule First Meeting
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    <th className="text-left px-3 py-2">Title</th>
                    <th className="text-left px-3 py-2">Date</th>
                    <th className="text-left px-3 py-2">Time</th>
                    <th className="text-left px-3 py-2">Location</th>
                    <th className="text-left px-3 py-2">Attendees</th>
                    <th className="text-left px-3 py-2">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {meetings.map((m: any, i: number) => (
                    <tr key={m.id ?? i} className="hover:bg-muted/50">
                      <td className="px-3 py-2 font-medium">{m.title ?? '—'}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {m.scheduled_date ?? m.date ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {m.scheduled_time ?? m.time ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {m.location ?? '—'}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground text-xs">
                        {Array.isArray(m.attendees)
                          ? m.attendees.join(', ')
                          : (m.attendees ?? '—')}
                      </td>
                      <td className="px-3 py-2">
                        {m.status ? (
                          <Badge variant="secondary" className={`text-xs ${statusColor(m.status)}`}>
                            {m.status}
                          </Badge>
                        ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule meeting dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Schedule Meeting</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label>Title *</Label>
              <Input
                value={form.title}
                onChange={e => handleChange('title', e.target.value)}
                placeholder="e.g. Farm Manager Quarterly Review"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Date *</Label>
                <Input
                  type="date"
                  value={form.scheduled_date}
                  onChange={e => handleChange('scheduled_date', e.target.value)}
                />
              </div>
              <div>
                <Label>Time</Label>
                <Input
                  type="time"
                  value={form.scheduled_time}
                  onChange={e => handleChange('scheduled_time', e.target.value)}
                />
              </div>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={form.location}
                onChange={e => handleChange('location', e.target.value)}
                placeholder="e.g. Head Office, Farm A, Online"
              />
            </div>
            <div>
              <Label>Attendees</Label>
              <Input
                value={form.attendees}
                onChange={e => handleChange('attendees', e.target.value)}
                placeholder="Comma-separated names"
              />
            </div>
            <div>
              <Label>Agenda</Label>
              <Textarea
                value={form.agenda}
                onChange={e => handleChange('agenda', e.target.value)}
                rows={3}
                placeholder="Meeting agenda..."
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowForm(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Scheduling…' : 'Schedule Meeting'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
