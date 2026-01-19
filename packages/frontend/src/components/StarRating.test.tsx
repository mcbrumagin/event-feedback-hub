import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StarRating } from './StarRating';

describe('StarRating', () => {
  it('renders 5 stars', () => {
    render(<StarRating rating={0} />);
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(5);
  });

  it('displays filled stars based on rating', () => {
    const { container } = render(<StarRating rating={3} readonly />);
    // Stars with fill-accent class indicate filled state
    const filledStars = container.querySelectorAll('.fill-accent');
    expect(filledStars).toHaveLength(3);
  });

  it('calls onChange when a star is clicked', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    
    render(<StarRating rating={0} onChange={onChange} />);
    
    const stars = screen.getAllByRole('button');
    await user.click(stars[3]); // Click 4th star
    
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it('does not call onChange when readonly', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    
    render(<StarRating rating={3} onChange={onChange} readonly />);
    
    const stars = screen.getAllByRole('button');
    await user.click(stars[4]);
    
    expect(onChange).not.toHaveBeenCalled();
  });

  it('applies correct size classes', () => {
    const { rerender, container } = render(<StarRating rating={3} size="sm" readonly />);
    expect(container.querySelector('.h-4')).toBeTruthy();
    
    rerender(<StarRating rating={3} size="lg" readonly />);
    expect(container.querySelector('.h-6')).toBeTruthy();
  });
});
