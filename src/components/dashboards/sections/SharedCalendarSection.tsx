"use client";

import React, { useState, useCallback, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg, EventClickArg, DateClickArg } from '@fullcalendar/core';
import { useApi } from '../../../hooks';
import { useAuth } from '../../../contexts/AuthContext';
import apiService from '../../../services/api';
import type { CalendarEventDTO, CalendarEventPayload } from '../../../services/api/calendar';
import { LoadingSpinner } from '../../common/LoadingSpinner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Plus, Pencil, Trash2, ExternalLink, X } from 'lucide-react';
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
    ? eventTypesRaw
    : Object.keys(CATEGORY_CONFIG);

  // ── Events (re-fetches when range or farm changes) ──
  const fetchEvents = useCallback(() => {
    if (!startStr || !endStr) return Promise.resolve([]);
    return apiService.calendar.getEvents({
      start: startStr,
      end: endStr,
      farm_id: farmFilter ? Number(farmFilter) : undefined,
    });
  }, [startStr, endStr, farmFilter]);
  const { data: eventsRaw, loading, refetch } = useApi(fetchEvents);
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
    const endDT = form.end_date
      ? form.all_day
        ? `${form.end_date}T23:59:59`
        : `${form.end_date}T${form.end_time || '23:59'}:00`
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
              <Select value={farmFilter || 'all'} onValueChange={v => setFarmFilter(v === 'all' ? '' : v)}>
                <SelectTrigger className="h-7 text-xs w-36">
                  <SelectValue placeholder="All farms" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All farms</SelectItem>
                  {farms.map((f: any) => {
                    const id = String(f.id ?? f.farm_id);
                    return <SelectItem key={id} value={id}>{f.name}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            )}
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
        <SheetContent className="sm:max-w-[400px] overflow-y-auto">
          {selectedEvent && (() => {
            const e = selectedEvent;
            const cfg = CATEGORY_CONFIG[e.category] ?? CATEGORY_CONFIG.custom;
            const canEdit = isOwnCustomEvent(e);
            return (
              <>
                <SheetHeader className="mb-4">
                  <div className="flex items-start gap-2">
                    <div className="w-3 rounded-full mt-1.5 flex-shrink-0" style={{ background: cfg.color, height: 12 }} />
                    <SheetTitle className="leading-snug">{e.title}</SheetTitle>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap ml-5">
                    <Badge variant="outline" style={{ borderColor: cfg.color, color: cfg.color }}>{cfg.label}</Badge>
                    {e.status && (
                      <Badge variant="secondary" className="capitalize">{e.status.replace(/_/g, ' ')}</Badge>
                    )}
                  </div>
                </SheetHeader>
                <div className="space-y-3 text-sm ml-5">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Date & Time</p>
                    <p className="font-medium">
                      {e.all_day
                        ? format(eventDate(e), 'MMMM d, yyyy') + ' (All day)'
                        : format(eventDate(e), 'MMM d, yyyy · HH:mm')}
                      {e.end && !e.all_day && ` – ${format(parseISO(e.end), 'HH:mm')}`}
                    </p>
                  </div>
                  {e.farm_name && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Farm</p>
                      <p className="font-medium">{e.farm_name}</p>
                    </div>
                  )}
                  {e.meta?.recurrence && e.meta.recurrence !== 'none' && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Repeats</p>
                      <p className="font-medium capitalize">{e.meta.recurrence as string}</p>
                    </div>
                  )}
                  {e.meta?.description && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Description</p>
                      <p className="text-gray-700">{e.meta.description as string}</p>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>
                      Source: <span className="font-medium capitalize">{e.source.replace(/_/g, ' ')}</span> #{e.source_id}
                    </span>
                  </div>
                  {canEdit && (
                    <div className="flex gap-2 pt-2">
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingEvent ? 'Edit Event' : 'New Event'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-1">

            {/* Title */}
            <div>
              <Label className="text-sm mb-1 block">Title <span className="text-red-500">*</span></Label>
              <Input
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="Event title"
              />
            </div>

            {/* Type */}
            <div>
              <Label className="text-sm mb-1 block">Type</Label>
              <Select value={form.event_type} onValueChange={v => setForm(f => ({ ...f, event_type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="reminder">Reminder</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="custom">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* All-day */}
            <div className="flex items-center gap-3">
              <Switch
                id="all-day"
                checked={form.all_day}
                onCheckedChange={v => setForm(f => ({ ...f, all_day: v }))}
              />
              <Label htmlFor="all-day" className="text-sm cursor-pointer">All day</Label>
            </div>

            {/* Start */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1 block">Start Date <span className="text-red-500">*</span></Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-sm font-normal">
                      {form.start_date || 'Pick date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.start_date ? parseISO(form.start_date) : undefined}
                      onSelect={d => d && setForm(f => ({ ...f, start_date: toDateStr(d) }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {!form.all_day && (
                <div>
                  <Label className="text-sm mb-1 block">Start Time</Label>
                  <Input
                    type="time"
                    value={form.start_time}
                    onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {/* End */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm mb-1 block">
                  End Date <span className="text-gray-400 font-normal">(optional)</span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-sm font-normal text-muted-foreground">
                      {form.end_date || 'No end date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.end_date ? parseISO(form.end_date) : undefined}
                      onSelect={d => d && setForm(f => ({ ...f, end_date: toDateStr(d) }))}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              {!form.all_day && form.end_date && (
                <div>
                  <Label className="text-sm mb-1 block">End Time</Label>
                  <Input
                    type="time"
                    value={form.end_time}
                    onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {/* Farm */}
            {farms.length > 0 && (
              <div>
                <Label className="text-sm mb-1 block">Farm</Label>
                <Select
                  value={form.farm_id ? String(form.farm_id) : 'none'}
                  onValueChange={v => setForm(f => ({ ...f, farm_id: v === 'none' ? undefined : Number(v) }))}
                >
                  <SelectTrigger><SelectValue placeholder="Select farm" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific farm</SelectItem>
                    {farms.map((farm: any) => {
                      const id = String(farm.id ?? farm.farm_id);
                      return <SelectItem key={id} value={id}>{farm.name}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Visibility */}
            <div>
              <Label className="text-sm mb-1 block">Visibility</Label>
              <Select value={form.visibility} onValueChange={v => setForm(f => ({ ...f, visibility: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="private">Only me</SelectItem>
                  <SelectItem value="farm">My farm</SelectItem>
                  {canSetAllVisibility && (
                    <SelectItem value="all">Everyone</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Recurrence */}
            <div>
              <Label className="text-sm mb-1 block">Repeat</Label>
              <Select value={form.recurrence ?? 'none'} onValueChange={v => setForm(f => ({ ...f, recurrence: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Does not repeat</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annually">Annually</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <Label className="text-sm mb-1 block">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </Label>
              <Textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Additional notes…"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={submitting}>
              {submitting ? <LoadingSpinner size="sm" /> : editingEvent ? 'Save Changes' : 'Create Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
