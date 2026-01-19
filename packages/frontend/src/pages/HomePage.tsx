import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StarRating } from '@/components/StarRating';
import { FeedbackCard } from '@/components/FeedbackCard';
import { fetchEvents, fetchFeedbacks, submitFeedback } from '@/lib/graphql';
import { useSSE } from '@/hooks/useSSE';
import { toEventViewModels, type EventViewModel } from '@/viewModels/event';
import type { Feedback, Event } from '@event-feedback-hub/shared';
import { log } from '@/lib/logger';
import { Radio, Wifi, WifiOff } from 'lucide-react';

export function HomePage() {
  // State
  const [events, setEvents] = useState<EventViewModel[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [feedbacks, setFeedbacks] = useState<(Feedback & { event: Event })[]>([]);
  const [newFeedbackIds, setNewFeedbackIds] = useState<Set<string>>(new Set());
  const [enabledRatings, setEnabledRatings] = useState<Set<number>>(new Set([1, 2, 3, 4, 5]));
  
  // Form state
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Load events on mount
  useEffect(() => {
    async function loadEvents() {
      try {
        const data = await fetchEvents();
        setEvents(toEventViewModels(data));
        // Auto-select first event if available
        if (data.length > 0 && !selectedEventId) {
          setSelectedEventId(data[0].id);
        }
      } catch (err) {
        log.error('Failed to load events', { error: err });
      }
    }
    loadEvents();
  }, []);

  // Load feedbacks when event changes (filter client-side for multi-select)
  useEffect(() => {
    async function loadFeedbacks() {
      if (!selectedEventId) return;
      try {
        const data = await fetchFeedbacks(selectedEventId, {
          limit: 50,
        });
        setFeedbacks(data);
      } catch (err) {
        log.error('Failed to load feedbacks', { error: err });
      }
    }
    loadFeedbacks();
  }, [selectedEventId]);

  // Filter feedbacks client-side based on enabled ratings
  const filteredFeedbacks = feedbacks.filter(f => enabledRatings.has(f.rating));

  // Toggle a single rating filter
  const toggleRating = (rating: number) => {
    setEnabledRatings(prev => {
      const next = new Set(prev);
      if (next.has(rating)) {
        next.delete(rating);
      } else {
        next.add(rating);
      }
      return next;
    });
  };

  // Select all ratings
  const selectAll = () => setEnabledRatings(new Set([1, 2, 3, 4, 5]));
  
  // Clear all ratings
  const clearAll = () => setEnabledRatings(new Set());

  // Handle new feedback from SSE
  const handleNewFeedback = useCallback((feedback: Feedback) => {
    // Find the event for this feedback
    const event = events.find(e => e.id === feedback.eventId);
    
    setFeedbacks(prev => [{
      ...feedback,
      event: event ? { 
        id: event.id, 
        name: event.name, 
        dateTime: event.dateTime.toISOString(),
        createdAt: new Date().toISOString()
      } : { 
        id: feedback.eventId, 
        name: 'Unknown', 
        dateTime: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    }, ...prev]);
    
    // Mark as new for animation
    setNewFeedbackIds(prev => new Set(prev).add(feedback.id));
    
    // Remove "new" status after animation
    setTimeout(() => {
      setNewFeedbackIds(prev => {
        const next = new Set(prev);
        next.delete(feedback.id);
        return next;
      });
    }, 3000);
  }, [events]);

  // SSE connection
  const { isConnected } = useSSE({
    eventId: selectedEventId,
    onFeedback: handleNewFeedback,
  });

  // Handle feedback submission
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedEventId || !feedbackText.trim() || feedbackRating === 0) return;

    setIsSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      await submitFeedback(selectedEventId, feedbackText.trim(), feedbackRating);
      setFeedbackText('');
      setFeedbackRating(0);
      setSubmitSuccess(true);
      setTimeout(() => setSubmitSuccess(false), 3000);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit feedback';
      setSubmitError(message);
      log.error('Failed to submit feedback', { error: err });
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div className="min-h-screen bg-background p-4">
      {/* Decorative background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-accent/5 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <header className="mb-6 animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Event Feedback Hub
          </h1>
          <p className="text-muted-foreground">
            Share your thoughts and see what others are saying in real-time
          </p>
        </header>

        {/* Event Selector - applies to both submit and live feedback */}
        <div className="mb-6 animate-fade-in" style={{ animationDelay: '50ms' }}>
          <Label htmlFor="event" className="text-sm text-muted-foreground mb-2 block">
            Select Event
          </Label>
          <Select
            value={selectedEventId ?? ''}
            onValueChange={setSelectedEventId}
          >
            <SelectTrigger id="event" className="max-w-md">
              <SelectValue placeholder="Select an event" />
            </SelectTrigger>
            <SelectContent>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  <span className="flex items-center gap-2">
                    {event.name}
                    {event.isPast && (
                      <span className="text-xs text-muted-foreground">(past)</span>
                    )}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Left column - Submit feedback */}
          <div className="space-y-6">
            <Card className="animate-fade-in" style={{ animationDelay: '100ms' }}>
              <CardHeader>
                <CardTitle className="text-xl">Submit Feedback</CardTitle>
                <CardDescription>
                  {selectedEvent ? `Share your experience for ${selectedEvent.name}` : 'Select an event above to submit feedback'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Rating</Label>
                    <StarRating
                      rating={feedbackRating}
                      onChange={setFeedbackRating}
                      size="lg"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="feedback">Your Feedback</Label>
                    <Textarea
                      id="feedback"
                      placeholder="Share your thoughts about this event..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      rows={4}
                    />
                  </div>

                  {submitError && (
                    <p className="text-sm text-destructive">{submitError}</p>
                  )}
                  
                  {submitSuccess && (
                    <p className="text-sm text-primary">Feedback submitted successfully!</p>
                  )}

                  <Button
                    type="submit"
                    disabled={isSubmitting || !selectedEventId || !feedbackText.trim() || feedbackRating === 0}
                    className="w-full"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Feedback stream */}
          <div className="space-y-4">
            <Card className="animate-fade-in" style={{ animationDelay: '200ms' }}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <Radio className="h-5 w-5 text-primary" />
                    Live Feedback
                  </CardTitle>
                  <div className="flex items-center gap-2 text-sm">
                    {isConnected ? (
                      <>
                        <Wifi className="h-4 w-4 text-primary" />
                        <span className="text-primary">Live</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Connecting...</span>
                      </>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Rating filter - toggleable multi-select */}
                <div className="mb-4">
                  <Label className="text-xs text-muted-foreground mb-2 block">
                    Filter by rating (click to toggle)
                  </Label>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selectAll}
                      disabled={enabledRatings.size === 5}
                    >
                      All
                    </Button>
                    {[5, 4, 3, 2, 1].map((rating) => (
                      <Button
                        key={rating}
                        variant={enabledRatings.has(rating) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => toggleRating(rating)}
                        className={!enabledRatings.has(rating) ? 'opacity-50' : ''}
                      >
                        {rating}★
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAll}
                      disabled={enabledRatings.size === 0}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {/* Feedback list */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {feedbacks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No feedback yet. Be the first to share!
                    </p>
                  ) : filteredFeedbacks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No feedback matches the selected filters
                    </p>
                  ) : (
                    <div className="animate-stagger">
                      {filteredFeedbacks.map((feedback) => (
                        <div key={feedback.id} className="mb-3">
                          <FeedbackCard
                            feedback={feedback}
                            isNew={newFeedbackIds.has(feedback.id)}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
