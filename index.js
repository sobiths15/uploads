const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { graphqlUploadExpress } = require('graphql-upload');
const { finished } = require('stream/promises');

// Type definitions define the "shape" of your data and specify
// what kind of operations can be done on the data.
const typeDefs = gql`
  scalar Upload

  type File {
    filename: String!
    mimetype: String!
    encoding: String!
  }

  type Query {
    hello: String
  }

  type Mutation {
    uploadFile(file: Upload!): File!
  }
`;

// Resolvers define the technique for fetching the types in the
// schema. This resolver uploads a file.
const resolvers = {
  Upload: require('graphql-upload').GraphQLUpload,

  Query: {
    hello: () => 'Hello world!',
  },

  Mutation: {
    uploadFile: async (parent, { file }) => {
      const { createReadStream, filename, mimetype, encoding } = await file;
      const stream = createReadStream();
      const out = require('fs').createWriteStream(`./uploads/${filename}`);
      stream.pipe(out);
      await finished(out);
      return { filename, mimetype, encoding };
    },
  },
};

async function startServer() {
  const app = express();
  app.use(graphqlUploadExpress({ maxFileSize: 10000000, maxFiles: 10 }));

  const server = new ApolloServer({
    typeDefs,
    resolvers,
  });

  await server.start();
  server.applyMiddleware({ app });

  app.listen({ port: 3000 }, () =>
    console.log(`🚀 Server ready at http://localhost:3000${server.graphqlPath}`)
  );
}

startServer();
