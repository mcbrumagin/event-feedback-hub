import { v4 as uuidv4 } from 'uuid';
import type { Event, Feedback, FeedbackFilters, CreateEventInput, SubmitFeedbackInput } from '@event-feedback-hub/shared';
import type { Repository, EventRepository, FeedbackRepository } from './types.js';
import { EventEmitter } from 'events';

// In-memory storage
const events: Map<string, Event> = new Map();
const feedbacks: Map<string, Feedback> = new Map();

// Event emitter for real-time updates
const feedbackEmitter = new EventEmitter();

// Seed some initial data for development
function seedData() {
  const now = new Date();
  
  const event1: Event = {
    id: uuidv4(),
    name: 'Tech Conference 2024',
    dateTime: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week ago
    createdAt: now.toISOString(),
  };
  
  const event2: Event = {
    id: uuidv4(),
    name: 'Product Launch Webinar',
    dateTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
    createdAt: now.toISOString(),
  };
  
  const event3: Event = {
    id: uuidv4(),
    name: 'Team Building Workshop',
    dateTime: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString(), // 1 month ago
    createdAt: now.toISOString(),
  };
  
  events.set(event1.id, event1);
  events.set(event2.id, event2);
  events.set(event3.id, event3);
  
  // Add some sample feedback
  const feedback1: Feedback = {
    id: uuidv4(),
    eventId: event1.id,
    text: 'Great event! Really enjoyed the keynote speakers.',
    rating: 5,
    createdAt: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  };
  
  const feedback2: Feedback = {
    id: uuidv4(),
    eventId: event1.id,
    text: 'Good content but the venue was too crowded.',
    rating: 3,
    createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  };
  
  const feedback3: Feedback = {
    id: uuidv4(),
    eventId: event3.id,
    text: 'The team activities were fun and engaging!',
    rating: 4,
    createdAt: new Date(now.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString(),
  };
  
  feedbacks.set(feedback1.id, feedback1);
  feedbacks.set(feedback2.id, feedback2);
  feedbacks.set(feedback3.id, feedback3);
}

// Initialize seed data
seedData();

class MemoryEventRepository implements EventRepository {
  async findAll(): Promise<Event[]> {
    return Array.from(events.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async findById(id: string): Promise<Event | null> {
    return events.get(id) || null;
  }

  async create(input: CreateEventInput): Promise<Event> {
    const event: Event = {
      id: uuidv4(),
      name: input.name,
      dateTime: input.dateTime,
      createdAt: new Date().toISOString(),
    };
    events.set(event.id, event);
    return event;
  }
}

class MemoryFeedbackRepository implements FeedbackRepository {
  async findByFilters(filters: FeedbackFilters): Promise<Feedback[]> {
    let result = Array.from(feedbacks.values())
      .filter(f => f.eventId === filters.eventId);
    
    // Apply rating filter
    if (filters.ratingFilter !== undefined) {
      result = result.filter(f => f.rating === filters.ratingFilter);
    }
    
    // Sort by creation time (newest first)
    result.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    // Apply pagination
    const skip = filters.skip || 0;
    const limit = filters.limit || 50;
    result = result.slice(skip, skip + limit);
    
    return result;
  }

  async findById(id: string): Promise<Feedback | null> {
    return feedbacks.get(id) || null;
  }

  async create(input: SubmitFeedbackInput): Promise<Feedback> {
    const feedback: Feedback = {
      id: uuidv4(),
      eventId: input.eventId,
      text: input.text,
      rating: input.rating,
      createdAt: new Date().toISOString(),
    };
    feedbacks.set(feedback.id, feedback);
    
    // Emit event for SSE subscribers
    feedbackEmitter.emit(`feedback:${input.eventId}`, feedback);
    
    return feedback;
  }

  subscribe(eventId: string, callback: (feedback: Feedback) => void): () => void {
    const eventName = `feedback:${eventId}`;
    feedbackEmitter.on(eventName, callback);
    
    // Return unsubscribe function
    return () => {
      feedbackEmitter.off(eventName, callback);
    };
  }
}

export function createMemoryRepository(): Repository {
  return {
    events: new MemoryEventRepository(),
    feedback: new MemoryFeedbackRepository(),
  };
}
