import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import mercurius from 'mercurius';
import { schema } from './schema.js';
import { createResolvers, type GraphQLContext } from './resolvers.js';
import { createMemoryRepository } from './repository/memory.js';
import { registerSSERoutes } from './sse.js';

// Cloud-native logger configuration (pino with structured JSON)
const isDev = process.env.NODE_ENV !== 'production';

const app = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    // In production, use JSON format for cloud logging
    // In development, use pretty printing
    transport: isDev
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
    // Add service identifier for log aggregation
    base: {
      service: 'event-feedback-hub-api',
      version: '1.0.0',
    },
  },
});

// Initialize repository
const repository = createMemoryRepository();

// Register CORS - support multiple origins for dev/network testing
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim());

app.log.info({ corsOrigins }, 'CORS origins configured');

await app.register(cors, {
  origin: (origin, cb) => {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) {
      cb(null, true);
      return;
    }
    
    // Check if origin is in allowed list
    if (corsOrigins.includes(origin) || corsOrigins.includes('*')) {
      cb(null, true);
      return;
    }
    
    // In development, be more permissive
    if (isDev) {
      app.log.warn({ origin }, 'Allowing unlisted origin in dev mode');
      cb(null, true);
      return;
    }
    
    cb(new Error('Not allowed by CORS'), false);
  },
  credentials: true,
});

// Register JWT
await app.register(jwt, {
  secret: process.env.JWT_SECRET || 'development-secret-change-in-production',
});

// Register Mercurius (GraphQL)
await app.register(mercurius, {
  schema,
  resolvers: createResolvers(repository),
  graphiql: isDev, // Enable GraphiQL in development
  context: async (request): Promise<Omit<GraphQLContext, 'app' | 'repository'>> => {
    // Check for admin JWT in Authorization header
    let isAdmin = false;
    
    const authHeader = request.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const decoded = app.jwt.verify(token) as { role?: string };
        isAdmin = decoded.role === 'admin';
      } catch (err) {
        // Invalid token - not admin
        app.log.debug('Invalid JWT token in request');
      }
    }
    
    return { isAdmin };
  },
});

// Extend context with app and repository
app.graphql.addHook('preExecution', async (schema, document, context) => {
  (context as GraphQLContext).app = app;
  (context as GraphQLContext).repository = repository;
  return { schema, document, context };
});

// Register SSE routes
registerSSERoutes(app, repository);

// Health check endpoint
app.get('/health', async () => {
  return { status: 'ok', service: 'event-feedback-hub-api', timestamp: new Date().toISOString() };
});

// Start server
const port = parseInt(process.env.PORT || '4000', 10);

const host = process.env.HOST || '0.0.0.0';

try {
  await app.listen({ port, host });
  app.log.info(`GraphQL endpoint: http://${host}:${port}/graphql`);
  if (isDev) {
    app.log.info(`GraphiQL: http://${host}:${port}/graphiql`);
  }
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
