import { BaseApiService } from './base';

export interface CalendarEventDTO {
  id: string;           // prefixed: "task-123", "custom-5", etc.
  title: string;
  start: string;        // ISO datetime
  end?: string;
  all_day: boolean;
  category: string;     // task | payroll | harvest | picking | attendance | procurement | processing | maintenance | climate | custom
  status?: string;
  farm_id?: number;
  farm_name?: string;
  source: string;       // original model name
  source_id: number;    // original record id
  color: string;
  meta?: Record<string, any>;
}

export interface CalendarEventPayload {
  title: string;
  description?: string;
  start_datetime: string;
  end_datetime?: string;
  all_day: boolean;
  event_type: string;   // custom | reminder | meeting | deadline
  farm_id?: number;
  visibility: string;   // private | farm | all
  recurrence?: string;  // none | weekly | monthly | quarterly | annually
}

export interface CalendarEventsParams {
  start: string;
  end: string;
  farm_id?: number;
  types?: string;
}

export class CalendarApiService extends BaseApiService {
  async getEvents(params: CalendarEventsParams): Promise<CalendarEventDTO[]> {
    const p: Record<string, any> = { start: params.start, end: params.end };
    if (params.farm_id) p.farm_id = params.farm_id;
    if (params.types)   p.types   = params.types;
    return this.get<CalendarEventDTO[]>('/calendar/events', p);
  }

  async createEvent(data: CalendarEventPayload): Promise<CalendarEventDTO> {
    return this.post<CalendarEventDTO>('/calendar/events', data);
  }

  async updateEvent(id: number, data: CalendarEventPayload): Promise<CalendarEventDTO> {
    return this.put<CalendarEventDTO>(`/calendar/events/${id}`, data);
  }

  async deleteEvent(id: number): Promise<void> {
    return this.delete<void>(`/calendar/events/${id}`);
  }

  async getEventTypes(): Promise<string[]> {
    return this.get<string[]>('/calendar/event-types');
  }
}
