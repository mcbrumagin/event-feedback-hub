import { describe, it, expect, vi, beforeEach } from 'vitest';

import {
  fetchEvents,
  fetchFeedbacks,
  submitFeedback,
  loginAdmin,
} from './graphql';

describe('GraphQL Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetchEvents', () => {
    it('returns list of events', async () => {
      const events = await fetchEvents();
      
      expect(events).toBeDefined();
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
      expect(events[0]).toHaveProperty('id');
      expect(events[0]).toHaveProperty('name');
      expect(events[0]).toHaveProperty('dateTime');
    });
  });

  describe('fetchFeedbacks', () => {
    it('returns feedbacks for an event', async () => {
      const feedbacks = await fetchFeedbacks('event-1');
      
      expect(feedbacks).toBeDefined();
      expect(Array.isArray(feedbacks)).toBe(true);
    });

    it('filters feedbacks by rating', async () => {
      const feedbacks = await fetchFeedbacks('event-1', { ratingFilter: 5 });
      
      expect(feedbacks).toBeDefined();
      expect(feedbacks.every((f) => f.rating === 5)).toBe(true);
    });
  });

  describe('submitFeedback', () => {
    it('submits feedback and returns the created feedback', async () => {
      const feedback = await submitFeedback('event-1', 'Test feedback', 5);
      
      expect(feedback).toBeDefined();
      expect(feedback).toHaveProperty('id');
      expect(feedback.text).toBe('Test feedback');
      expect(feedback.rating).toBe(5);
      expect(feedback.eventId).toBe('event-1');
    });
  });

  describe('loginAdmin', () => {
    it('returns token for valid credentials', async () => {
      const result = await loginAdmin('admin123');
      
      expect(result).toBeDefined();
      expect(result.token).toBeDefined();
    });

    it('throws error for invalid credentials', async () => {
      await expect(loginAdmin('wrongpassword')).rejects.toThrow();
    });
  });
});
