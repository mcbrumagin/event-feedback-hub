import type { Event } from '@event-feedback-hub/shared';
import { formatDate } from '@/lib/utils';

// View model for event display
export interface EventViewModel {
  id: string;
  name: string;
  formattedDateTime: string;
  isPast: boolean;
  dateTime: Date;
}

// Transform API event to view model
export function toEventViewModel(event: Event): EventViewModel {
  const dateTime = new Date(event.dateTime);
  return {
    id: event.id,
    name: event.name,
    formattedDateTime: formatDate(event.dateTime),
    isPast: dateTime < new Date(),
    dateTime,
  };
}

// Transform multiple events
export function toEventViewModels(events: Event[]): EventViewModel[] {
  return events.map(toEventViewModel);
}
