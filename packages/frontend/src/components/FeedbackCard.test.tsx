import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FeedbackCard } from './FeedbackCard';

describe('FeedbackCard', () => {
  const mockFeedback = {
    id: 'feedback-1',
    text: 'This was a great event!',
    rating: 4,
    createdAt: new Date().toISOString(),
    event: {
      name: 'Tech Conference 2024',
    },
  };

  it('renders feedback text', () => {
    render(<FeedbackCard feedback={mockFeedback} />);
    expect(screen.getByText('This was a great event!')).toBeInTheDocument();
  });

  it('renders star rating', () => {
    const { container } = render(<FeedbackCard feedback={mockFeedback} />);
    // Should have 4 filled stars
    const filledStars = container.querySelectorAll('.fill-accent');
    expect(filledStars).toHaveLength(4);
  });

  it('shows event name when showEventName is true', () => {
    render(<FeedbackCard feedback={mockFeedback} showEventName />);
    expect(screen.getByText('Tech Conference 2024')).toBeInTheDocument();
  });

  it('hides event name when showEventName is false', () => {
    render(<FeedbackCard feedback={mockFeedback} showEventName={false} />);
    expect(screen.queryByText('Tech Conference 2024')).not.toBeInTheDocument();
  });

  it('applies highlight styling when isNew is true', () => {
    const { container } = render(<FeedbackCard feedback={mockFeedback} isNew />);
    const card = container.firstChild;
    expect(card).toHaveClass('ring-2');
    expect(card).toHaveClass('ring-primary');
  });

  it('does not apply highlight styling when isNew is false', () => {
    const { container } = render(<FeedbackCard feedback={mockFeedback} isNew={false} />);
    const card = container.firstChild;
    expect(card).not.toHaveClass('ring-2');
  });
});
