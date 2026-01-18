import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import type { Repository } from './repository/types.js';

// SSE endpoint for real-time feedback streaming
export function registerSSERoutes(app: FastifyInstance, repository: Repository) {
  app.get<{
    Params: { eventId: string };
  }>('/api/events/:eventId/feedback/stream', async (request: FastifyRequest<{ Params: { eventId: string } }>, reply: FastifyReply) => {
    const { eventId } = request.params;
    
    // Validate event exists
    const event = await repository.events.findById(eventId);
    if (!event) {
      return reply.status(404).send({ error: 'Event not found' });
    }

    app.log.info({ eventId }, 'SSE client connected for feedback stream');

    // Set SSE headers - use origin from request for CORS
    const origin = request.headers.origin || '*';
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Credentials': 'true',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    });

    // Send initial connection event
    reply.raw.write(`event: connected\ndata: ${JSON.stringify({ eventId, message: 'Connected to feedback stream' })}\n\n`);

    // Subscribe to new feedback
    const unsubscribe = repository.feedback.subscribe(eventId, (feedback) => {
      app.log.info({ eventId, feedbackId: feedback.id }, 'Sending feedback via SSE');
      reply.raw.write(`event: feedback\ndata: ${JSON.stringify(feedback)}\n\n`);
    });

    // Heartbeat to keep connection alive (every 30 seconds)
    const heartbeatInterval = setInterval(() => {
      reply.raw.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);
    }, 30000);

    // Cleanup on client disconnect
    request.raw.on('close', () => {
      app.log.info({ eventId }, 'SSE client disconnected');
      clearInterval(heartbeatInterval);
      unsubscribe();
    });

    // Don't end the response - keep it open for SSE
    await new Promise(() => {});
  });
}
