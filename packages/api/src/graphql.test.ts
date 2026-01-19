import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { buildTestApp, type TestApp } from './test/app.js';

describe('GraphQL API', () => {
  let testApp: TestApp;

  beforeEach(async () => {
    testApp = await buildTestApp();
  });

  afterEach(async () => {
    await testApp.app.close();
  });

  describe('Events', () => {
    it('should return all events', async () => {
      const response = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            query {
              events {
                id
                name
                dateTime
              }
            }
          `,
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.events).toBeDefined();
      expect(Array.isArray(body.data.events)).toBe(true);
      expect(body.data.events.length).toBeGreaterThan(0);
    });

    it('should return a single event by ID', async () => {
      // First get all events
      const eventsResponse = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `query { events { id name } }`,
        },
      });
      
      const events = JSON.parse(eventsResponse.payload).data.events;
      const eventId = events[0].id;

      // Then fetch single event
      const response = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            query GetEvent($id: ID!) {
              event(id: $id) {
                id
                name
                dateTime
              }
            }
          `,
          variables: { id: eventId },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.event).toBeDefined();
      expect(body.data.event.id).toBe(eventId);
    });
  });

  describe('Feedback Submission', () => {
    it('should submit feedback successfully', async () => {
      // Get an event ID first
      const eventsResponse = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `query { events { id } }`,
        },
      });
      const eventId = JSON.parse(eventsResponse.payload).data.events[0].id;

      // Submit feedback
      const response = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            mutation SubmitFeedback($eventId: ID!, $text: String!, $rating: Int!) {
              submitFeedback(eventId: $eventId, text: $text, rating: $rating) {
                id
                eventId
                text
                rating
                createdAt
              }
            }
          `,
          variables: {
            eventId,
            text: 'This is a test feedback',
            rating: 4,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.submitFeedback).toBeDefined();
      expect(body.data.submitFeedback.text).toBe('This is a test feedback');
      expect(body.data.submitFeedback.rating).toBe(4);
      expect(body.data.submitFeedback.eventId).toBe(eventId);
    });

    it('should reject invalid rating (< 1)', async () => {
      const eventsResponse = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `query { events { id } }`,
        },
      });
      const eventId = JSON.parse(eventsResponse.payload).data.events[0].id;

      const response = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            mutation SubmitFeedback($eventId: ID!, $text: String!, $rating: Int!) {
              submitFeedback(eventId: $eventId, text: $text, rating: $rating) {
                id
              }
            }
          `,
          variables: {
            eventId,
            text: 'Invalid rating test',
            rating: 0,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.errors).toBeDefined();
      expect(body.errors[0].message).toContain('Rating must be between 1 and 5');
    });

    it('should reject invalid rating (> 5)', async () => {
      const eventsResponse = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `query { events { id } }`,
        },
      });
      const eventId = JSON.parse(eventsResponse.payload).data.events[0].id;

      const response = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            mutation SubmitFeedback($eventId: ID!, $text: String!, $rating: Int!) {
              submitFeedback(eventId: $eventId, text: $text, rating: $rating) {
                id
              }
            }
          `,
          variables: {
            eventId,
            text: 'Invalid rating test',
            rating: 6,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.errors).toBeDefined();
      expect(body.errors[0].message).toContain('Rating must be between 1 and 5');
    });

    it('should reject feedback for non-existent event', async () => {
      const response = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            mutation SubmitFeedback($eventId: ID!, $text: String!, $rating: Int!) {
              submitFeedback(eventId: $eventId, text: $text, rating: $rating) {
                id
              }
            }
          `,
          variables: {
            eventId: 'non-existent-event',
            text: 'Test feedback',
            rating: 5,
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.errors).toBeDefined();
      expect(body.errors[0].message).toContain('Event not found');
    });
  });

  describe('Feedback Retrieval', () => {
    it('should retrieve feedbacks for an event', async () => {
      // Get event and submit feedback
      const eventsResponse = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `query { events { id } }`,
        },
      });
      const eventId = JSON.parse(eventsResponse.payload).data.events[0].id;

      // Submit a feedback first
      await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            mutation SubmitFeedback($eventId: ID!, $text: String!, $rating: Int!) {
              submitFeedback(eventId: $eventId, text: $text, rating: $rating) { id }
            }
          `,
          variables: { eventId, text: 'Test', rating: 5 },
        },
      });

      // Retrieve feedbacks
      const response = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            query GetFeedbacks($eventId: ID!) {
              feedbacks(eventId: $eventId) {
                id
                text
                rating
                createdAt
                event {
                  id
                  name
                }
              }
            }
          `,
          variables: { eventId },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.feedbacks).toBeDefined();
      expect(Array.isArray(body.data.feedbacks)).toBe(true);
    });

    it('should filter feedbacks by rating', async () => {
      const eventsResponse = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `query { events { id } }`,
        },
      });
      const eventId = JSON.parse(eventsResponse.payload).data.events[0].id;

      // Submit feedbacks with different ratings
      await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `mutation { submitFeedback(eventId: "${eventId}", text: "5 stars", rating: 5) { id } }`,
        },
      });
      await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `mutation { submitFeedback(eventId: "${eventId}", text: "3 stars", rating: 3) { id } }`,
        },
      });

      // Filter by rating 5
      const response = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            query GetFeedbacks($eventId: ID!, $ratingFilter: Int) {
              feedbacks(eventId: $eventId, ratingFilter: $ratingFilter) {
                id
                rating
              }
            }
          `,
          variables: { eventId, ratingFilter: 5 },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.feedbacks.every((f: { rating: number }) => f.rating === 5)).toBe(true);
    });
  });

  describe('Admin Authentication', () => {
    it('should login with correct password', async () => {
      const response = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            mutation LoginAdmin($password: String!) {
              loginAdmin(password: $password) {
                token
              }
            }
          `,
          variables: { password: 'admin123' },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.loginAdmin.token).toBeDefined();
    });

    it('should reject wrong password', async () => {
      const response = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            mutation LoginAdmin($password: String!) {
              loginAdmin(password: $password) {
                token
              }
            }
          `,
          variables: { password: 'wrongpassword' },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.errors).toBeDefined();
      expect(body.errors[0].message).toContain('Invalid credentials');
    });

    it('should allow admin to create events', async () => {
      // Login first
      const loginResponse = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            mutation LoginAdmin($password: String!) {
              loginAdmin(password: $password) {
                token
              }
            }
          `,
          variables: { password: 'admin123' },
        },
      });
      const token = JSON.parse(loginResponse.payload).data.loginAdmin.token;

      // Create event with auth
      const response = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        headers: {
          authorization: `Bearer ${token}`,
        },
        payload: {
          query: `
            mutation CreateEvent($name: String!, $dateTime: DateTime!) {
              createEvent(name: $name, dateTime: $dateTime) {
                id
                name
                dateTime
              }
            }
          `,
          variables: {
            name: 'New Test Event',
            dateTime: '2024-06-15T10:00:00.000Z',
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.data.createEvent).toBeDefined();
      expect(body.data.createEvent.name).toBe('New Test Event');
    });

    it('should reject unauthenticated event creation', async () => {
      const response = await testApp.app.inject({
        method: 'POST',
        url: '/graphql',
        payload: {
          query: `
            mutation CreateEvent($name: String!, $dateTime: DateTime!) {
              createEvent(name: $name, dateTime: $dateTime) {
                id
              }
            }
          `,
          variables: {
            name: 'Unauthorized Event',
            dateTime: '2024-06-15T10:00:00.000Z',
          },
        },
      });

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.payload);
      expect(body.errors).toBeDefined();
      expect(body.errors[0].message).toContain('Unauthorized');
    });
  });
});
