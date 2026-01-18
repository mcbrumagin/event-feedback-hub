import { GraphQLClient, gql } from 'graphql-request';
import type { Event, Feedback, AuthPayload } from '@event-feedback-hub/shared';
import { log } from './logger';

const API_URL = `${import.meta.env.VITE_API_URL}/graphql`;

// Create client with dynamic headers (for auth token)
function createClient(token?: string) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  log.info(`API_URL ${API_URL}`);
  return new GraphQLClient(API_URL, { headers });
}

// Queries
export const EVENTS_QUERY = gql`
  query Events {
    events {
      id
      name
      dateTime
      createdAt
    }
  }
`;

export const FEEDBACKS_QUERY = gql`
  query Feedbacks($eventId: ID!, $ratingFilter: Int, $skip: Int, $limit: Int) {
    feedbacks(eventId: $eventId, ratingFilter: $ratingFilter, skip: $skip, limit: $limit) {
      id
      eventId
      text
      rating
      createdAt
      event {
        id
        name
      }
    }
  }
`;

// Mutations
export const LOGIN_MUTATION = gql`
  mutation LoginAdmin($password: String!) {
    loginAdmin(password: $password) {
      token
    }
  }
`;

export const CREATE_EVENT_MUTATION = gql`
  mutation CreateEvent($name: String!, $dateTime: DateTime!) {
    createEvent(name: $name, dateTime: $dateTime) {
      id
      name
      dateTime
      createdAt
    }
  }
`;

export const SUBMIT_FEEDBACK_MUTATION = gql`
  mutation SubmitFeedback($eventId: ID!, $text: String!, $rating: Int!) {
    submitFeedback(eventId: $eventId, text: $text, rating: $rating) {
      id
      eventId
      text
      rating
      createdAt
    }
  }
`;

// API functions
export async function fetchEvents(): Promise<Event[]> {
  log.debug('Fetching events');
  const client = createClient();
  const data = await client.request<{ events: Event[] }>(EVENTS_QUERY);
  log.info('Events fetched', { count: data.events.length });
  return data.events;
}

export async function fetchFeedbacks(
  eventId: string,
  options?: { ratingFilter?: number; skip?: number; limit?: number }
): Promise<(Feedback & { event: Event })[]> {
  log.debug('Fetching feedbacks', { eventId, ...options });
  const client = createClient();
  const data = await client.request<{ feedbacks: (Feedback & { event: Event })[] }>(
    FEEDBACKS_QUERY,
    { eventId, ...options }
  );
  log.info('Feedbacks fetched', { eventId, count: data.feedbacks.length });
  return data.feedbacks;
}

export async function loginAdmin(password: string): Promise<AuthPayload> {
  log.info('Attempting admin login');
  const client = createClient();
  const data = await client.request<{ loginAdmin: AuthPayload }>(LOGIN_MUTATION, { password });
  log.info('Admin login successful');
  return data.loginAdmin;
}

export async function createEvent(
  name: string,
  dateTime: string,
  token: string
): Promise<Event> {
  log.info('Creating event', { name, dateTime });
  const client = createClient(token);
  const data = await client.request<{ createEvent: Event }>(CREATE_EVENT_MUTATION, {
    name,
    dateTime,
  });
  log.info('Event created', { eventId: data.createEvent.id });
  return data.createEvent;
}

export async function submitFeedback(
  eventId: string,
  text: string,
  rating: number
): Promise<Feedback> {
  log.info('Submitting feedback', { eventId, rating });
  const client = createClient();
  const data = await client.request<{ submitFeedback: Feedback }>(SUBMIT_FEEDBACK_MUTATION, {
    eventId,
    text,
    rating,
  });
  log.info('Feedback submitted', { feedbackId: data.submitFeedback.id });
  return data.submitFeedback;
}
