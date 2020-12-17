const {kafka} = require("../../kafka");

const authors = [
  { id: 1, name: "Alice" },
  { id: 2, name: "Bob" }
];

module.exports = {
  get: () => {
    return authors;
  },
  removeById: (id) => {
    const authorIndex = authors.findIndex(author => author.id === id);

    if (authorIndex === -1) {
      return null;
    }

    authors.splice(authorIndex, 1);
    kafka.produce('AUTHOR_REMOVED', id);
    return id;
  }
};