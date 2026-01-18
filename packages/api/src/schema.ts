// GraphQL Schema Definition (SDL)
export const schema = `
  scalar DateTime

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

  type AuthPayload {
    token: String!
  }

  type Query {
    events: [Event!]!
    event(id: ID!): Event
    feedbacks(
      eventId: ID!
      ratingFilter: Int
      skip: Int
      limit: Int
    ): [Feedback!]!
  }

  type Mutation {
    # Admin only - requires JWT
    loginAdmin(password: String!): AuthPayload!
    createEvent(name: String!, dateTime: DateTime!): Event!
    
    # Public
    submitFeedback(eventId: ID!, text: String!, rating: Int!): Feedback!
  }
`;
