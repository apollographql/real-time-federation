const posts = require("./data");
const { kafka } = require("../../kafka");

module.exports = {
  Author: {
    posts(author, args, context, info) {
      return posts.get().filter((post) => post.authorId === author.id);
    },
  },

  Post: {
    author(post) {
      return { __typename: "Author", id: post.authorID };
    },
  },

  Query: {
    post(root, { id }, context, info) {
      return posts.get().find((post) => post.id === parseInt(id));
    },
    posts(root, args, context, info) {
      return posts.get();
    },
  },

  Mutation: {
    addPost(root, { authorID, content, title }, context, info) {
      const postID = posts.get().length + 1;
      const post = {
        authorID,
        content,
        title,
        id: postID,
        publishedAt: new Date().toISOString(),
      };

      posts.add(post);

      return post;
    },
  },
};
