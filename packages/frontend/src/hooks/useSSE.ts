import { useEffect, useRef, useCallback, useState } from 'react';
import type { Feedback } from '@event-feedback-hub/shared';
import { log } from '@/lib/logger';

interface UseSSEOptions {
  eventId: string | null;
  onFeedback: (feedback: Feedback) => void;
}

export function useSSE({ eventId, onFeedback }: UseSSEOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const onFeedbackRef = useRef(onFeedback);

  // Keep callback ref updated
  onFeedbackRef.current = onFeedback;

  const connect = useCallback(() => {
    if (!eventId) return;

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    log.info('Connecting to SSE', { eventId });
    // Use API URL from env, fallback to relative path for Vite proxy
    const apiBase = import.meta.env.VITE_API_URL || '';
    const url = `${apiBase}/api/events/${eventId}/feedback/stream`;
    log.info('SSE URL', { url });
    const eventSource = new EventSource(url, { withCredentials: true });
    eventSourceRef.current = eventSource;

    eventSource.addEventListener('connected', (event) => {
      log.info('SSE connected', { eventId, data: event.data });
      setIsConnected(true);
      setError(null);
    });

    eventSource.addEventListener('feedback', (event) => {
      try {
        const feedback = JSON.parse(event.data) as Feedback;
        log.debug('SSE feedback received', { feedbackId: feedback.id });
        onFeedbackRef.current(feedback);
      } catch (err) {
        log.error('Failed to parse SSE feedback', { error: err });
      }
    });

    eventSource.addEventListener('heartbeat', () => {
      log.debug('SSE heartbeat received');
    });

    eventSource.onerror = (err) => {
      log.error('SSE error', { error: err, eventId });
      setError('Connection lost. Reconnecting...');
      setIsConnected(false);
    };

    eventSource.onopen = () => {
      log.info('SSE connection opened', { eventId });
    };
  }, [eventId]);

  const disconnect = useCallback(() => {
    if (eventSourceRef.current) {
      log.info('Disconnecting SSE');
      eventSourceRef.current.close();
      eventSourceRef.current = null;
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { isConnected, error, reconnect: connect };
}
