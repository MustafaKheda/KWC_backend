// import dotenv from "dotenv";
// import connectDB from "./db/index.js";
// import { app } from "./app.js";
// import { ApolloServer } from 'apollo-server-express';
// import { schema } from "./graphql/index.js";
// import { ApolloServerPluginLandingPageLocalDefault, ApolloServerPluginLandingPageProductionDefault } from '@apollo/server/plugin/landingPage/default';
// // Load environment variables from .env file
// dotenv.config({
//   path: "./.env",
// });

// // Function to initialize and start Apollo Server
// async function startApolloServer(app) {
//   const server = new ApolloServer({
//     schema, // Pass your GraphQL schema
//     plugins: [
//       // Install a landing page plugin based on NODE_ENV
//       process.env.NODE_ENV === 'production'
//         ? ApolloServerPluginLandingPageProductionDefault({
//           graphRef: 'My-Graph-9szr0q@current',
//           footer: false,
//         })
//         : ApolloServerPluginLandingPageLocalDefault({ footer: false }),
//     ],
//   });

//   // Start the Apollo Server
//   await server.start();

//   // Apply Apollo middleware to the Express app
//   server.applyMiddleware({ app, path: "/graphql" });

//   console.log(`🚀 GraphQL server ready at /graphql`);
//   return server;
// }

// // Connect to the database and start the server
// (async () => {
//   try {
//     // Start the Apollo Server and retrieve the server instance
//     const server = await startApolloServer(app);

//     // Connect to the database
//     await connectDB();
//     console.log("✅ Connected to MongoDB");

//     // Start the Express server
//     const PORT = process.env.PORT || 5000;
//     app.listen(PORT, () => {
//       console.log(`Server running at http://localhost:${PORT}${server.graphqlPath}`);
//       console.log(`Server running on port : ${process.env.PORT || 5000}`);

//     });
//   } catch (err) {
//     console.error("❌ Server initialization failed:", err);
//   }
// })();

import dotenv from "dotenv";
import connectDB from "./db/index.js";
import { app } from "./app.js";
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@apollo/server/express4";
import { schema } from "./graphql/index.js";
import {
  ApolloServerPluginLandingPageLocalDefault,
  ApolloServerPluginLandingPageProductionDefault,
} from "@apollo/server/plugin/landingPage/default";

// Load environment variables from .env file
dotenv.config({
  path: "./.env",
});

// Function to initialize and start Apollo Server
async function startApolloServer(app) {
  const server = new ApolloServer({
    schema, // Pass your GraphQL schema
    plugins: [
      process.env.NODE_ENV === "production"
        ? ApolloServerPluginLandingPageProductionDefault({
          graphRef: "My-Graph-9szr0q@current",
          footer: false,
        })
        : ApolloServerPluginLandingPageLocalDefault({ footer: false }),
    ],
  });

  // Start the Apollo Server
  await server.start();

  // Apply Apollo middleware to the Express app
  app.use(
    "/graphql",
    expressMiddleware(server, {
      context: async ({ req, res }) => ({
        req,
        res,
      }),
    })
  );

  console.log(`🚀 GraphQL server ready at /graphql`);
  return server;
}

// Connect to the database and start the server
(async () => {
  try {
    // Start the Apollo Server and retrieve the server instance
    const server = await startApolloServer(app);

    // Connect to the database
    await connectDB();
    console.log("✅ Connected to MongoDB");

    // Start the Express server
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}/graphql`);
    });
  } catch (err) {
    console.error("❌ Server initialization failed:", err);
  }
})();
