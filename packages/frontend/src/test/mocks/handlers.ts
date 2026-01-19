import { graphql, HttpResponse } from 'msw';

export const mockEvents = [
  {
    id: 'event-1',
    name: 'Tech Conference 2024',
    dateTime: '2024-01-15T10:00:00.000Z',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'event-2',
    name: 'Product Launch',
    dateTime: '2024-02-20T14:00:00.000Z',
    createdAt: '2024-01-05T00:00:00.000Z',
  },
];

export const mockFeedbacks = [
  {
    id: 'feedback-1',
    eventId: 'event-1',
    text: 'Great event!',
    rating: 5,
    createdAt: '2024-01-16T12:00:00.000Z',
    event: mockEvents[0],
  },
  {
    id: 'feedback-2',
    eventId: 'event-1',
    text: 'Could be better',
    rating: 3,
    createdAt: '2024-01-16T13:00:00.000Z',
    event: mockEvents[0],
  },
];

export const handlers = [
  
  graphql.query('Events', () => {
    return HttpResponse.json({
      data: {
        events: mockEvents,
      },
    });
  }),

  graphql.query('Feedbacks', ({ variables }) => {
    const { eventId, ratingFilter } = variables;
    let feedbacks = mockFeedbacks.filter((f) => f.eventId === eventId);
    
    if (ratingFilter !== undefined) {
      feedbacks = feedbacks.filter((f) => f.rating === ratingFilter);
    }
    
    return HttpResponse.json({
      data: {
        feedbacks,
      },
    });
  }),

  graphql.mutation('SubmitFeedback', ({ variables }) => {
    const { eventId, text, rating } = variables;
    const newFeedback = {
      id: `feedback-${Date.now()}`,
      eventId,
      text,
      rating,
      createdAt: new Date().toISOString(),
    };
    
    return HttpResponse.json({
      data: {
        submitFeedback: newFeedback,
      },
    });
  }),

  graphql.mutation('LoginAdmin', ({ variables }) => {
    const { password } = variables;
    
    if (password === 'admin123') {
      return HttpResponse.json({
        data: {
          loginAdmin: {
            token: 'mock-jwt-token',
          },
        },
      });
    }
    
    return HttpResponse.json({
      errors: [{ message: 'Invalid credentials' }],
    });
  }),

  graphql.mutation('CreateEvent', ({ variables }) => {
    const { name, dateTime } = variables;
    const newEvent = {
      id: `event-${Date.now()}`,
      name,
      dateTime,
      createdAt: new Date().toISOString(),
    };
    
    return HttpResponse.json({
      data: {
        createEvent: newEvent,
      },
    });
  }),
];
