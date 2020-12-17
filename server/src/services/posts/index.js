require("dotenv").config();
const { ApolloServer, SchemaDirectiveVisitor } = require("apollo-server");
const { buildFederatedSchema } = require("@apollo/federation");

let posts = require("./data");
const PublishDirective = require("../shared/PublishDirective");
const resolvers = require("./resolvers");
const typeDefs = require("./typeDefs");
const { kafka } = require("../../kafka");

const schema = buildFederatedSchema([{ typeDefs, resolvers }]);
const directives = { _publish: PublishDirective };
SchemaDirectiveVisitor.visitSchemaDirectives(schema, directives);

const server = new ApolloServer({ schema });

server.listen(process.env.POSTS_SERVICE_PORT).then(({ url }) => {
  console.log(`🚀 Posts service ready at ${url}`);
});

/* Messages from Authors Service */

kafka.subscribe('AUTHOR_REMOVED', ({ message }) => {
  const filteredPosts = posts.filter(
    post => post.authorID !== parseInt(message)
  );
  posts = filteredPosts;
});
