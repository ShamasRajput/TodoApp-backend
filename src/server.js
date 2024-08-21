// src/server.js
const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? 'https://todo-app-kappa-two-75.vercel.app'
    : 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

// Define Mongoose schema and model
const TodoSchema = new mongoose.Schema({
  text: { type: String, required: true },
  completed: { type: Boolean, default: false },
  attachment: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Todo = mongoose.models.Todo || mongoose.model('Todo', TodoSchema);


// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.log(err));

// GraphQL schema
const typeDefs = gql`
  type Todo {
    id: ID!
    text: String!
    completed: Boolean!
    attachment: String
    createdAt: String!
  }

  type Query {
    todos: [Todo!]!
  }

  type Mutation {
    addTodo(text: String!, attachment: String): Todo!
    updateTodo(
      id: ID!
      text: String
      completed: Boolean
      attachment: String
    ): Todo
    deleteTodo(id: ID!): Boolean
  }
`;

// GraphQL resolvers
const resolvers = {
  Query: {
    todos: async () => {
      return await Todo.find().sort({ createdAt: -1 });
    },
  },
  Mutation: {
    addTodo: async (_, { text, attachment }) => {
      const newTodo = new Todo({
        text,
        completed: false,
        attachment,
        createdAt: new Date(),
      });
      return await newTodo.save();
    },
    updateTodo: async (_, { id, text, completed, attachment }) => {
      return await Todo.findByIdAndUpdate(
        id,
        { text, completed, attachment },
        { new: true }
      );
    },
    deleteTodo: async (_, { id }) => {
      await Todo.findByIdAndDelete(id);
      return true;
    },
  },
};

// Create and start Apollo Server
async function startApolloServer() {
  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });

  app.get('/', (req, res) => {
    res.send('<h1>Welcome to the TodoApp Backend!</h1>');
  });

  // Start the Express server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}${server.graphqlPath}`);
  });
}

// Start the server
startApolloServer();
