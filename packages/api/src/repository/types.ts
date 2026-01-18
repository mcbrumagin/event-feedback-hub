import type { Event, Feedback, FeedbackFilters, CreateEventInput, SubmitFeedbackInput } from '@event-feedback-hub/shared';

// Repository interfaces - abstracts storage layer
// Implementations: MemoryRepository (now), MongoRepository (later)

export interface EventRepository {
  findAll(): Promise<Event[]>;
  findById(id: string): Promise<Event | null>;
  create(input: CreateEventInput): Promise<Event>;
}

export interface FeedbackRepository {
  findByFilters(filters: FeedbackFilters): Promise<Feedback[]>;
  findById(id: string): Promise<Feedback | null>;
  create(input: SubmitFeedbackInput): Promise<Feedback>;
  
  // For SSE - subscribe to new feedback for an event
  subscribe(eventId: string, callback: (feedback: Feedback) => void): () => void;
}

export interface Repository {
  events: EventRepository;
  feedback: FeedbackRepository;
}
