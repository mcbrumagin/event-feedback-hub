# Event Feedback Hub

A real-time event feedback system built with React, Fastify, GraphQL (Mercurius), and SSE for live updates.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │     │      API        │     │    Database     │
│  React + TS     │────▶│ Fastify +       │────▶│  In-Memory      │
│  (Port 5173)    │     │ Mercurius       │     │  → MongoDB      │
│                 │◀────│  (Port 4000)    │◀────│                 │
│   SSE Client    │ SSE │   SSE Server    │watch│                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Features

- **Feedback Submission**: Users can select an event and submit feedback with a 1-5 star rating
- **Real-time Updates**: SSE-powered live feedback stream
- **Admin Panel**: JWT-protected admin area for creating events (including past events)
- **Filtering**: Filter feedback by rating
- **Cloud-native Logging**: Structured JSON logging with pino for easy log aggregation

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite 7, Tailwind CSS, shadcn/ui components
- **API**: Fastify, Mercurius (GraphQL), pino (logging)
- **Auth**: JWT (hard-coded admin password for development)
- **Real-time**: Server-Sent Events (SSE)
- **Future**: MongoDB with change streams

## Project Structure

```
event-feedback-hub/
├── packages/
│   ├── api/           # Fastify + Mercurius GraphQL API
│   ├── frontend/      # React + Vite frontend
│   └── shared/        # Shared TypeScript types
├── docker-compose.yml # Production compose
├── docker-compose.dev.yml # Development compose
└── package.json       # Workspace root
```

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 9+

### Development

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Build the shared package:
   ```bash
   pnpm --filter @event-feedback-hub/shared build
   ```

3. Start both API and frontend in development mode:
   ```bash
   pnpm dev
   ```

   Or run them separately:
   ```bash
   # Terminal 1 - API
   pnpm dev:api

   # Terminal 2 - Frontend
   pnpm dev:frontend
   ```

4. Open the app:
   - Frontend: http://localhost:5173
   - GraphiQL: http://localhost:4000/graphiql
   - API Health: http://localhost:4000/health

### Admin Login

Default admin password: `admin123`

### Docker

Build and run with Docker Compose:

```bash
# Production
docker-compose up --build

# Development (with hot reload for API)
docker-compose -f docker-compose.dev.yml up --build
```

Access:
- Frontend: http://localhost:5137 (vite)
- API: http://localhost:4000

## API

### GraphQL Endpoints

- `POST /graphql` - GraphQL queries and mutations
- `GET /graphiql` - GraphiQL IDE (development only)

### SSE Endpoint

- `GET /api/events/:eventId/feedback/stream` - Real-time feedback stream

### GraphQL Schema

```graphql
type Event {
  id: ID!
  name: String!
  dateTime: DateTime!
  createdAt: DateTime!
}

type Feedback {
  id: ID!
  eventId: ID!
  event: Event!
  text: String!
  rating: Int!
  createdAt: DateTime!
}

type Query {
  events: [Event!]!
  event(id: ID!): Event
  feedbacks(eventId: ID!, ratingFilter: Int, skip: Int, limit: Int): [Feedback!]!
}

type Mutation {
  loginAdmin(password: String!): AuthPayload!
  createEvent(name: String!, dateTime: DateTime!): Event!  # Admin only
  submitFeedback(eventId: ID!, text: String!, rating: Int!): Feedback!
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for JWT signing | `development-secret...` |
| `ADMIN_PASSWORD` | Admin login password | `admin123` |
| `PORT` | API port | `4000` |
| `HOST` | API host | `0.0.0.0` |
| `LOG_LEVEL` | Logging level | `info` |
| `CORS_ORIGIN` | Allowed CORS origin | `http://localhost:5173` |

## Roadmap

### For Version 1
- [ ] MongoDB persistence with change streams for SSE
- [ ] Research graphql-sse vs current live feedback implementation
- [ ] Versioned graphql API for better longterm support across applications
- [ ] Social authentication for attendees - limit 1 review per event per attendee
- [ ] Proper admin page and 1-way password encryption for event hosts
- [ ] Sysadmin(s) to easily create/manage event admins

### Horizon Features
- [ ] Feedback moderation and automatic profanity filtering
- [ ] Optional event sign-in required to review as an attendee (QR code at event)
- [ ] Event analytics/dashboard
- [ ] Email notifications
- [ ] Export feedback reports
