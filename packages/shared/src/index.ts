// Event Feedback Hub - Shared Types
// These types serve as the single source of truth for:
// - GraphQL schema types
// - API repository layer
// - Frontend view models (transformed from these)
// - Future MongoDB schemas

export interface Event {
  id: string;
  name: string;
  dateTime: string; // ISO 8601 format
  createdAt: string; // ISO 8601 format
}

export interface Feedback {
  id: string;
  eventId: string;
  text: string;
  rating: number; // 1-5
  createdAt: string; // ISO 8601 format
}

// Input types for mutations
export interface CreateEventInput {
  name: string;
  dateTime: string;
}

export interface SubmitFeedbackInput {
  eventId: string;
  text: string;
  rating: number;
}

// Query filter types
export interface FeedbackFilters {
  eventId: string;
  ratingFilter?: number;
  skip?: number;
  limit?: number;
}

// Auth types
export interface AuthPayload {
  token: string;
}

export interface JwtPayload {
  role: 'admin';
  iat: number;
  exp: number;
}

// SSE Event types
export interface SSEFeedbackEvent {
  type: 'feedback';
  data: Feedback;
}

export interface SSEHeartbeatEvent {
  type: 'heartbeat';
  timestamp: string;
}

export type SSEEvent = SSEFeedbackEvent | SSEHeartbeatEvent;
