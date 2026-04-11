"use client";

import React, { useState, useCallback, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg, EventClickArg } from '@fullcalendar/core';
import type { DateClickArg } from '@fullcalendar/interaction';
import { useApi } from '../../../hooks';
import { useAuth } from '../../../contexts/AuthContext';
import apiService from '../../../services/api';
import type { CalendarEventDTO, CalendarEventPayload } from '../../../services/api/calendar';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Plus, Pencil, Trash2, ExternalLink, X, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format, parseISO, isValid } from 'date-fns';

// ─── Category config ────────────────────────────────────────────────────────
const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  task:        { label: 'Tasks',        color: '#F59E0B', bg: 'bg-amber-100',    border: 'border-amber-400'  },
  payroll:     { label: 'Payroll',      color: '#10B981', bg: 'bg-green-100',    border: 'border-green-400'  },
  harvest:     { label: 'Harvest',      color: '#F97316', bg: 'bg-orange-100',   border: 'border-orange-400' },
  picking:     { label: 'Picking',      color: '#EAB308', bg: 'bg-yellow-100',   border: 'border-yellow-400' },
  attendance:  { label: 'Attendance',   color: '#3B82F6', bg: 'bg-blue-100',     border: 'border-blue-400'   },
  procurement: { label: 'Procurement',  color: '#8B5CF6', bg: 'bg-purple-100',   border: 'border-purple-400' },
  processing:  { label: 'Processing',   color: '#92400E', bg: 'bg-amber-900/20', border: 'border-amber-800'  },
  maintenance: { label: 'Maintenance',  color: '#EF4444', bg: 'bg-red-100',      border: 'border-red-400'    },
  climate:     { label: 'Climate',      color: '#14B8A6', bg: 'bg-teal-100',     border: 'border-teal-400'   },
  custom:      { label: 'Custom',       color: '#6366F1', bg: 'bg-indigo-100',   border: 'border-indigo-400' },
};

const CAN_SET_ALL_VISIBILITY = ['admin', 'manager', 'managing_director'];

// ─── Helpers ────────────────────────────────────────────────────────────────
function toDateStr(d: Date) { return format(d, 'yyyy-MM-dd'); }

function eventDate(e: CalendarEventDTO): Date {
  const d = parseISO(e.start);
  return isValid(d) ? d : new Date();
}

function isCompleted(status?: string) {
  return status === 'completed' || status === 'approved' || status === 'collected';
}

type FormState = CalendarEventPayload & {
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
};

function emptyForm(): FormState {
  const today = format(new Date(), 'yyyy-MM-dd');
  return {
    title: '', description: '', start_datetime: '',
    end_datetime: undefined, all_day: false,
    event_type: 'custom', farm_id: undefined, visibility: 'private',
    recurrence: 'none',
    start_date: today, start_time: '08:00', end_date: '', end_time: '',
  };
}

// ─── Props ──────────────────────────────────────────────────────────────────
interface SharedCalendarSectionProps {
  userRole: string;
  farmId?: number;
}

// ═══════════════════════════════════════════════════════════════════════════
export function SharedCalendarSection({ userRole, farmId }: SharedCalendarSectionProps) {
  const { user } = useAuth();
  const calendarRef = useRef<FullCalendar>(null);

  // ── Date range (driven by FullCalendar's datesSet callback) ──
  const [startStr, setStartStr] = useState('');
  const [endStr, setEndStr]     = useState('');

  // ── Filters ──
  const [farmFilter, setFarmFilter]         = useState<string>(farmId ? String(farmId) : '');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  // ── Modal state ──
  const [selectedEvent, setSelectedEvent] = useState<CalendarEventDTO | null>(null);
  const [showAddModal, setShowAddModal]   = useState(false);
  const [editingEvent, setEditingEvent]   = useState<CalendarEventDTO | null>(null);
  const [form, setForm]                   = useState<FormState>(emptyForm());
  const [submitting, setSubmitting]       = useState(false);
  const [deletingId, setDeletingId]       = useState<number | null>(null);

  // ── Farms ──
  const getFarms = useCallback(() => apiService.getFarms(userRole), [userRole]);
  const { data: farmsData } = useApi(getFarms);
  const farms: any[] = Array.isArray(farmsData) ? farmsData : [];

  // ── Event types ──
  const fetchEventTypes = useCallback(() => apiService.calendar.getEventTypes(), []);
  const { data: eventTypesRaw } = useApi(fetchEventTypes);
  const availableCategories: string[] = Array.isArray(eventTypesRaw) && eventTypesRaw.length > 0
    ? (eventTypesRaw as any[]).map((t) => (typeof t === 'string' ? t : t.name ?? t.type ?? String(t)))
    : Object.keys(CATEGORY_CONFIG);

  // ── Events (re-fetches when range or farm changes) ──
  // Always send at least the user's own farmId so the backend returns
  // events shared with that farm (visibility=farm / visibility=all).
  const resolvedFarmId = farmFilter ? Number(farmFilter) : (farmId ?? undefined);
  const fetchEvents = useCallback(() => {
    if (!startStr || !endStr) return Promise.resolve([]);
    return apiService.calendar.getEvents({
      start: startStr,
      end: endStr,
      farm_id: resolvedFarmId,
    });
  }, [startStr, endStr, resolvedFarmId]);
  const { data: eventsRaw, loading, refetch } = useApi(fetchEvents, {
    dependencies: [startStr, endStr, resolvedFarmId],
  });
  const allEvents: CalendarEventDTO[] = Array.isArray(eventsRaw) ? eventsRaw : [];

  // ── Client-side category filter ──
  const filteredEvents = useMemo(() =>
    activeCategories.length === 0
      ? allEvents
      : allEvents.filter(e => activeCategories.includes(e.category)),
    [allEvents, activeCategories]
  );

  // ── Map to FullCalendar event objects ──
  const fcEvents = useMemo(() =>
    filteredEvents.map(e => ({
      id: e.id,
      title: e.title,
      start: e.start,
      end: e.end,
      allDay: e.all_day,
      backgroundColor: e.color,
      borderColor: e.color,
      opacity: isCompleted(e.status) ? 0.5 : 1,
      extendedProps: e,
    })),
    [filteredEvents]
  );

  // ── FullCalendar callbacks ──
  const handleDatesSet = useCallback((arg: DatesSetArg) => {
    setStartStr(toDateStr(arg.start));
    setEndStr(toDateStr(arg.end));
  }, []);

  const handleDateClick = useCallback((arg: DateClickArg) => {
    const f = emptyForm();
    f.start_date = toDateStr(arg.date);
    f.all_day = arg.allDay;
    if (farmFilter) f.farm_id = Number(farmFilter);
    setForm(f);
    setEditingEvent(null);
    setShowAddModal(true);
  }, [farmFilter]);

  const handleEventClick = useCallback((arg: EventClickArg) => {
    setSelectedEvent(arg.event.extendedProps as CalendarEventDTO);
  }, []);

  // ── Category toggle ──
  const toggleCategory = (cat: string) => {
    setActiveCategories(prev =>
      prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]
    );
  };

  // ── Open edit modal ──
  const openEdit = (e: CalendarEventDTO) => {
    const d = eventDate(e);
    const endD = e.end ? parseISO(e.end) : null;
    setForm({
      title: e.title,
      description: (e.meta?.description as string) ?? '',
      start_datetime: e.start,
      end_datetime: e.end,
      all_day: e.all_day,
      event_type: (e.meta?.event_type as string) ?? 'custom',
      farm_id: e.farm_id,
      visibility: (e.meta?.visibility as string) ?? 'private',
      recurrence: (e.meta?.recurrence as string) ?? 'none',
      start_date: format(d, 'yyyy-MM-dd'),
      start_time: e.all_day ? '08:00' : format(d, 'HH:mm'),
      end_date: endD ? format(endD, 'yyyy-MM-dd') : '',
      end_time: endD && !e.all_day ? format(endD, 'HH:mm') : '',
    });
    setEditingEvent(e);
    setSelectedEvent(null);
    setShowAddModal(true);
  };

  // ── Build save payload ──
  const buildPayload = (): CalendarEventPayload => {
    const startDT = form.all_day
      ? `${form.start_date}T00:00:00`
      : `${form.start_date}T${form.start_time || '00:00'}:00`;
    const endDate = form.end_date || form.start_date;
    const endDT = form.all_day
      ? `${endDate}T23:59:59`
      : form.end_time
        ? `${endDate}T${form.end_time}:00`
        : undefined;
    return {
      title: form.title.trim(),
      description: form.description?.trim() || undefined,
      start_datetime: startDT,
      end_datetime: endDT,
      all_day: form.all_day,
      event_type: form.event_type,
      farm_id: form.farm_id || undefined,
      visibility: form.visibility,
      recurrence: form.recurrence !== 'none' ? form.recurrence : undefined,
    };
  };

  // ── Save ──
  const handleSave = async () => {
    if (!form.title.trim()) return toast.error('Title is required');
    if (!form.start_date)   return toast.error('Start date is required');
    setSubmitting(true);
    try {
      const payload = buildPayload();
      if (editingEvent) {
        await apiService.calendar.updateEvent(editingEvent.source_id, payload);
        toast.success('Event updated');
      } else {
        await apiService.calendar.createEvent(payload);
        toast.success('Event created');
      }
      setShowAddModal(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to save event');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ──
  const handleDelete = async (e: CalendarEventDTO) => {
    if (!confirm(`Delete "${e.title}"?`)) return;
    setDeletingId(e.source_id);
    try {
      await apiService.calendar.deleteEvent(e.source_id);
      toast.success('Event deleted');
      setSelectedEvent(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to delete event');
    } finally {
      setDeletingId(null);
    }
  };

  const isOwnCustomEvent = (e: CalendarEventDTO) =>
    e.source === 'calendar_event' && e.meta?.created_by === user?.id;

  const canSetAllVisibility = CAN_SET_ALL_VISIBILITY.includes(userRole);

  // ═══════════════════════════════════════════════════════════════════════════
  //  RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">

      {/* ── Filter / Actions bar ── */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 flex-wrap">
            {farms.length > 1 && (
              <select
                value={farmFilter || 'all'}
                onChange={e => setFarmFilter(e.target.value === 'all' ? '' : e.target.value)}
                className="h-7 text-xs border border-gray-300 rounded-md px-2 focus:outline-none focus:ring-1 focus:ring-blue-500 w-36"
              >
                <option value="all">All farms</option>
                {farms.map((f: any) => {
                  const id = String(f.id ?? f.farm_id);
                  return <option key={id} value={id}>{f.name}</option>;
                })}
              </select>
            )}
            <button
              onClick={() => refetch()}
              disabled={loading}
              title="Reload events"
              className="h-7 w-7 flex items-center justify-center border border-gray-300 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
            </button>
            <div className="flex gap-1.5 flex-wrap flex-1">
              {Object.entries(CATEGORY_CONFIG)
                .filter(([key]) => availableCategories.includes(key))
                .map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => toggleCategory(key)}
                    className={cn(
                      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-opacity',
                      activeCategories.includes(key)
                        ? 'opacity-100 font-medium'
                        : activeCategories.length > 0 ? 'opacity-40' : 'opacity-80',
                      cfg.bg, cfg.border
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }} />
                    {cfg.label}
                  </button>
                ))}
              {activeCategories.length > 0 && (
                <button
                  onClick={() => setActiveCategories([])}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
                >
                  <X className="w-3 h-3" /> Clear
                </button>
              )}
            </div>
            <Button
              size="sm"
              className="h-7 gap-1.5 text-xs ml-auto"
              onClick={() => { setForm(emptyForm()); setEditingEvent(null); setShowAddModal(true); }}
            >
              <Plus className="w-3.5 h-3.5" /> Add Event
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── FullCalendar ── */}
      <Card>
        <CardContent className="p-4 relative">
          {loading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 rounded-lg">
              <LoadingSpinner size="lg" />
            </div>
          )}
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth,timeGridWeek,listWeek',
            }}
            events={fcEvents}
            datesSet={handleDatesSet}
            dateClick={handleDateClick}
            eventClick={handleEventClick}
            firstDay={1}
            height="auto"
            eventClassNames="cursor-pointer"
          />
        </CardContent>
      </Card>

      {/* ── Event Detail Sheet ── */}
      <Sheet open={!!selectedEvent} onOpenChange={open => { if (!open) setSelectedEvent(null); }}>
        <SheetContent className="sm:max-w-[480px] overflow-y-auto">
          {selectedEvent && (() => {
            const e = selectedEvent;
            const cfg = CATEGORY_CONFIG[e.category] ?? CATEGORY_CONFIG.custom;
            const canEdit = isOwnCustomEvent(e);
            const startDt = eventDate(e);
            const endDt = e.end ? parseISO(e.end) : null;

            // Known meta keys handled explicitly — rest shown generically
            const KNOWN_META = new Set(['description', 'event_type', 'visibility', 'recurrence', 'created_by']);
            const extraMeta = e.meta
              ? Object.entries(e.meta).filter(([k]) => !KNOWN_META.has(k))
              : [];

            const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
                <p className="text-sm font-medium text-gray-900">{value}</p>
              </div>
            );

            return (
              <>
                <SheetHeader className="mb-4">
                  <div className="flex items-start gap-2">
                    <div className="w-3 h-3 rounded-full mt-1 flex-shrink-0" style={{ background: cfg.color }} />
                    <SheetTitle className="leading-snug">{e.title}</SheetTitle>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap ml-5">
                    <Badge variant="outline" style={{ borderColor: cfg.color, color: cfg.color }}>{cfg.label}</Badge>
                    {e.status && (
                      <Badge variant="secondary" className="capitalize">{e.status.replace(/_/g, ' ')}</Badge>
                    )}
                    {e.meta?.event_type && (
                      <Badge variant="secondary" className="capitalize">{String(e.meta.event_type).replace(/_/g, ' ')}</Badge>
                    )}
                  </div>
                </SheetHeader>

                <div className="space-y-4 text-sm">

                  {/* ── Date / Time block ── */}
                  <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-lg border">
                    <Row
                      label="Start"
                      value={e.all_day
                        ? format(startDt, 'EEE, MMM d yyyy')
                        : format(startDt, 'EEE, MMM d yyyy · HH:mm')}
                    />
                    <Row
                      label="End"
                      value={endDt
                        ? e.all_day
                          ? format(endDt, 'EEE, MMM d yyyy')
                          : format(endDt, 'EEE, MMM d yyyy · HH:mm')
                        : '—'}
                    />
                    <Row label="Duration" value={e.all_day ? 'All day' : endDt
                      ? (() => {
                          const mins = Math.round((endDt.getTime() - startDt.getTime()) / 60000);
                          if (mins < 60) return `${mins} min`;
                          const h = Math.floor(mins / 60), m = mins % 60;
                          return m > 0 ? `${h}h ${m}m` : `${h}h`;
                        })()
                      : '—'
                    } />
                    {e.meta?.recurrence && e.meta.recurrence !== 'none' && (
                      <Row label="Repeats" value={<span className="capitalize">{String(e.meta.recurrence)}</span>} />
                    )}
                  </div>

                  {/* ── Location / Farm ── */}
                  {e.farm_name && (
                    <Row label="Farm" value={e.farm_name} />
                  )}

                  {/* ── Visibility ── */}
                  {e.meta?.visibility && (
                    <Row label="Visibility" value={
                      e.meta.visibility === 'private' ? 'Only me'
                      : e.meta.visibility === 'farm' ? 'My farm'
                      : 'Everyone'
                    } />
                  )}

                  {/* ── Description ── */}
                  {e.meta?.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Description</p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-2 border">
                        {String(e.meta.description)}
                      </p>
                    </div>
                  )}

                  {/* ── Extra meta fields from operational events ── */}
                  {extraMeta.length > 0 && (
                    <>
                      <Separator />
                      <div className="grid grid-cols-2 gap-3">
                        {extraMeta.map(([key, val]) => (
                          <Row
                            key={key}
                            label={key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                            value={val == null ? '—' : typeof val === 'object' ? JSON.stringify(val) : String(val)}
                          />
                        ))}
                      </div>
                    </>
                  )}

                  {/* ── Source ── */}
                  <Separator />
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>
                      Source: <span className="font-medium capitalize">{e.source.replace(/_/g, ' ')}</span>
                      {' '}·{' '}ID #{e.source_id}
                      {e.meta?.created_by && (
                        <> · Created by user #{String(e.meta.created_by)}</>
                      )}
                    </span>
                  </div>

                  {/* ── Actions ── */}
                  {canEdit && (
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" variant="outline" className="flex-1 gap-1.5" onClick={() => openEdit(e)}>
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Button>
                      <Button
                        size="sm" variant="destructive" className="flex-1 gap-1.5"
                        disabled={deletingId === e.source_id}
                        onClick={() => handleDelete(e)}
                      >
                        {deletingId === e.source_id ? <LoadingSpinner size="sm" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Delete
                      </Button>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </SheetContent>
      </Sheet>

      {/* ── Add / Edit Event Dialog ── */}
      <Dialog open={showAddModal} onOpenChange={open => { if (!open) setShowAddModal(false); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'New Event'}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3 py-2">

            {/* Title — full width */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Event title"
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.event_type}
                onChange={e => setForm(f => ({ ...f, event_type: e.target.value }))}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="meeting">Meeting</option>
                <option value="reminder">Reminder</option>
                <option value="maintenance">Maintenance</option>
                <option value="custom">Other</option>
              </select>
            </div>

            {/* Repeat */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Repeat</label>
              <select
                value={form.recurrence ?? 'none'}
                onChange={e => setForm(f => ({ ...f, recurrence: e.target.value }))}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="none">Does not repeat</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
                <option value="annually">Annually</option>
              </select>
            </div>

            {/* All-day */}
            <div className="col-span-2 flex items-center gap-2">
              <input
                id="all-day"
                type="checkbox"
                checked={form.all_day}
                onChange={e => setForm(f => ({ ...f, all_day: e.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <label htmlFor="all-day" className="text-sm font-medium text-gray-700 cursor-pointer">All day</label>
            </div>

            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
              <input
                type="time"
                value={form.start_time}
                disabled={form.all_day}
                onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Date <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="date"
                value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
              <input
                type="time"
                value={form.end_time}
                disabled={form.all_day}
                onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            {/* Farm */}
            {farms.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Farm</label>
                <select
                  value={form.farm_id ? String(form.farm_id) : ''}
                  onChange={e => setForm(f => ({ ...f, farm_id: e.target.value ? Number(e.target.value) : undefined }))}
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">No specific farm</option>
                  {farms.map((farm: any) => {
                    const id = String(farm.id ?? farm.farm_id);
                    return <option key={id} value={id}>{farm.name}</option>;
                  })}
                </select>
              </div>
            )}

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Visibility</label>
              <select
                value={form.visibility}
                onChange={e => setForm(f => ({ ...f, visibility: e.target.value }))}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="private">Only me</option>
                <option value="farm">My farm</option>
                {canSetAllVisibility && <option value="all">Everyone</option>}
              </select>
            </div>

            {/* Description — full width */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Additional notes…"
                rows={3}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting ? <LoadingSpinner size="sm" /> : editingEvent ? 'Save Changes' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
