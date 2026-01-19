import { describe, it, expect } from 'vitest';

import {
  toFeedbackViewModel,
  toFeedbackViewModels,
} from './feedback';

describe('Feedback View Models', () => {
  const mockFeedback = {
    id: 'feedback-1',
    eventId: 'event-1',
    text: 'Great event!',
    rating: 4,
    createdAt: '2024-01-15T12:00:00.000Z',
    event: {
      id: 'event-1',
      name: 'Tech Conference',
      dateTime: '2024-01-15T10:00:00.000Z',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  };

  describe('toFeedbackViewModel', () => {
    it('transforms feedback to view model', () => {
      const vm = toFeedbackViewModel(mockFeedback);

      expect(vm.id).toBe('feedback-1');
      expect(vm.text).toBe('Great event!');
      expect(vm.rating).toBe(4);
      expect(vm.eventName).toBe('Tech Conference');
      expect(vm.eventId).toBe('event-1');
    });

    it('creates stars array based on rating', () => {
      const vm = toFeedbackViewModel(mockFeedback);

      expect(vm.stars).toHaveLength(5);
      expect(vm.stars[0]).toBe(true);  // Star 1
      expect(vm.stars[1]).toBe(true);  // Star 2
      expect(vm.stars[2]).toBe(true);  // Star 3
      expect(vm.stars[3]).toBe(true);  // Star 4
      expect(vm.stars[4]).toBe(false); // Star 5
    });

    it('includes formatted date', () => {
      const vm = toFeedbackViewModel(mockFeedback);

      expect(vm.formattedDate).toBeDefined();
      expect(typeof vm.formattedDate).toBe('string');
    });

    it('includes relative time', () => {
      const vm = toFeedbackViewModel(mockFeedback);

      expect(vm.timeAgo).toBeDefined();
      expect(typeof vm.timeAgo).toBe('string');
    });

    it('handles missing event gracefully', () => {
      const feedbackWithoutEvent = { ...mockFeedback, event: undefined };
      const vm = toFeedbackViewModel(feedbackWithoutEvent);

      expect(vm.eventName).toBe('Unknown Event');
    });
  });

  describe('toFeedbackViewModels', () => {
    it('transforms array of feedbacks', () => {
      const feedbacks = [
        mockFeedback,
        { ...mockFeedback, id: 'feedback-2', rating: 5 },
      ];

      const vms = toFeedbackViewModels(feedbacks);

      expect(vms).toHaveLength(2);
      expect(vms[0].id).toBe('feedback-1');
      expect(vms[1].id).toBe('feedback-2');
      expect(vms[1].rating).toBe(5);
    });

    it('returns empty array for empty input', () => {
      const vms = toFeedbackViewModels([]);
      expect(vms).toHaveLength(0);
    });
  });
});
