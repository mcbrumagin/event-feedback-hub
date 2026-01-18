import type { FastifyInstance } from 'fastify';
import type { Repository } from './repository/types.js';

// Context type for resolvers
export interface GraphQLContext {
  app: FastifyInstance;
  repository: Repository;
  isAdmin: boolean;
}

export function createResolvers(repository: Repository) {
  return {
    Query: {
      events: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
        ctx.app.log.info({ resolver: 'events' }, 'Fetching all events');
        return repository.events.findAll();
      },

      event: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
        ctx.app.log.info({ resolver: 'event', eventId: args.id }, 'Fetching event by ID');
        return repository.events.findById(args.id);
      },

      feedbacks: async (
        _: unknown,
        args: { eventId: string; ratingFilter?: number; skip?: number; limit?: number },
        ctx: GraphQLContext
      ) => {
        ctx.app.log.info(
          { resolver: 'feedbacks', ...args },
          'Fetching feedbacks with filters'
        );
        return repository.feedback.findByFilters({
          eventId: args.eventId,
          ratingFilter: args.ratingFilter,
          skip: args.skip,
          limit: args.limit,
        });
      },
    },

    Mutation: {
      loginAdmin: async (
        _: unknown,
        args: { password: string },
        ctx: GraphQLContext
      ) => {
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        if (args.password !== adminPassword) {
          ctx.app.log.warn('Failed admin login attempt');
          throw new Error('Invalid credentials');
        }

        ctx.app.log.info('Admin login successful');
        const token = ctx.app.jwt.sign({ role: 'admin' }, { expiresIn: '24h' });
        return { token };
      },

      createEvent: async (
        _: unknown,
        args: { name: string; dateTime: string },
        ctx: GraphQLContext
      ) => {
        // Check admin authorization
        if (!ctx.isAdmin) {
          ctx.app.log.warn('Unauthorized attempt to create event');
          throw new Error('Unauthorized: Admin access required');
        }

        ctx.app.log.info({ name: args.name, dateTime: args.dateTime }, 'Creating new event');
        return repository.events.create({
          name: args.name,
          dateTime: args.dateTime,
        });
      },

      submitFeedback: async (
        _: unknown,
        args: { eventId: string; text: string; rating: number },
        ctx: GraphQLContext
      ) => {
        // Validate rating
        if (args.rating < 1 || args.rating > 5) {
          throw new Error('Rating must be between 1 and 5');
        }

        // Validate event exists
        const event = await repository.events.findById(args.eventId);
        if (!event) {
          throw new Error('Event not found');
        }

        ctx.app.log.info(
          { eventId: args.eventId, rating: args.rating },
          'Submitting new feedback'
        );
        
        return repository.feedback.create({
          eventId: args.eventId,
          text: args.text,
          rating: args.rating,
        });
      },
    },

    // Field resolvers
    Feedback: {
      event: async (parent: { eventId: string }, _: unknown, ctx: GraphQLContext) => {
        return repository.events.findById(parent.eventId);
      },
    },
  };
}
