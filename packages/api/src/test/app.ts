// Test app builder - creates a Fastify instance for testing
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import mercurius from 'mercurius';
import { schema } from '../schema.js';
import { createResolvers, type GraphQLContext } from '../resolvers.js';
import { createMemoryRepository } from '../repository/memory.js';
import { registerSSERoutes } from '../sse.js';
import type { Repository } from '../repository/types.js';

export interface TestApp {
  app: ReturnType<typeof Fastify>;
  repository: Repository;
}

export async function buildTestApp(): Promise<TestApp> {
  const app = Fastify({
    logger: false, // Disable logging in tests
  });

  const repository = createMemoryRepository();

  await app.register(cors, {
    origin: true,
    credentials: true,
  });

  await app.register(jwt, {
    secret: 'test-secret',
  });

  await app.register(mercurius, {
    schema,
    resolvers: createResolvers(repository),
    graphiql: false,
    context: async (request): Promise<Omit<GraphQLContext, 'app' | 'repository'>> => {
      let isAdmin = false;
      
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          const token = authHeader.slice(7);
          const decoded = app.jwt.verify(token) as { role?: string };
          isAdmin = decoded.role === 'admin';
        } catch {
          // Invalid token
        }
      }
      
      return { isAdmin };
    },
  });

  app.graphql.addHook('preExecution', async (schema, document, context) => {
    (context as GraphQLContext).app = app;
    (context as GraphQLContext).repository = repository;
    return { schema, document, context };
  });

  registerSSERoutes(app, repository);

  app.get('/health', async () => {
    return { status: 'ok' };
  });

  return { app, repository };
}
