// import { makeExecutableSchema } from "@graphql - tools / schema"
import { productSchema } from "./schemas/productSchema.js";
import { productResolvers } from "./reslovers/productReslover.js";
import { makeExecutableSchema } from "@graphql-tools/schema";



// Combine all schemas into one
const typeDefs = [productSchema];  // Add other schemas like userSchema if needed

// Combine all resolvers into one
const resolvers = [productResolvers];  // Add other resolvers like userResolver if needed

// Create the executable schema
export const schema = makeExecutableSchema({ typeDefs, resolvers });