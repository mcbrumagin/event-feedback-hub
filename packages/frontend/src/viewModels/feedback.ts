import type { Feedback, Event } from '@event-feedback-hub/shared';
import { formatRelativeTime, formatDate } from '@/lib/utils';

// View model for feedback display
export interface FeedbackViewModel {
  id: string;
  text: string;
  rating: number;
  stars: boolean[]; // [true, true, true, false, false] for rating 3
  timeAgo: string;
  formattedDate: string;
  eventName: string;
  eventId: string;
}

// Transform API feedback to view model
export function toFeedbackViewModel(
  feedback: Feedback & { event?: Event }
): FeedbackViewModel {
  return {
    id: feedback.id,
    text: feedback.text,
    rating: feedback.rating,
    stars: Array.from({ length: 5 }, (_, i) => i < feedback.rating),
    timeAgo: formatRelativeTime(feedback.createdAt),
    formattedDate: formatDate(feedback.createdAt),
    eventName: feedback.event?.name ?? 'Unknown Event',
    eventId: feedback.eventId,
  };
}

// Transform multiple feedbacks
export function toFeedbackViewModels(
  feedbacks: (Feedback & { event?: Event })[]
): FeedbackViewModel[] {
  return feedbacks.map(toFeedbackViewModel);
}
