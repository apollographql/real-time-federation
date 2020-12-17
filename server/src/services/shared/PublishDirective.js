const { defaultFieldResolver } = require("graphql");
const { SchemaDirectiveVisitor } = require("apollo-server");

class PublishDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve = defaultFieldResolver } = field;
    const { payload, event } = this.args;

    field.resolve = async function (source, args, context, info) {
      const result = await resolve.call(this, source, args, context, info);

      let streamData = [];

      console.log('\x1b[41m!!!!!! 1 \x1b[0m', 1);
      if (typeof result === "object" && result !== null) {
        console.log('\x1b[41m!!!!!! 2  result payload \x1b[0m', result, payload);
        streamData = payload.split(" ").reduce((acc, curr) => {
          acc.push(curr, result[curr]);
          return acc;
        }, streamData);
      } else {
        // Assumes string, number, or boolean
        // @TODO: Handle list response too?
        console.log('\x1b[41m!!!!!! payload result \x1b[0m', payload, result);
        streamData.push(payload, result);
      }

      console.log('\x1b[41mevent  \x1b[0m', event);
      console.log('\x1b[41mstreamData  \x1b[0m', streamData);
      // @TODO: as a part of POC - this is another place to produce kafka events

      return result;
    };
  }
}

module.exports = PublishDirective;
