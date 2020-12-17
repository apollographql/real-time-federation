# Real-time Queries with Apollo Federation and Kafka Demo
This repository is a demo of using Apollo Federation with Kafka to build a real-time Queries with websockets.

Apollo Federation doesn’t provide support [subscription operations](https://www.apollographql.com/docs/apollo-server/data/subscriptions/) at this time, but support for real-time query updates may be achieved by alternative means and may simultaneously complement certain software architectures. This repository demonstrates a possible solution for achieving real-time query updates to GraphQL clients through a combination of custom directives, an event store, and a transport layer for delivering event-related messages to the client. In tandem, this approach can provide a potential solution for communication between implementing services.


## Usage

1. walk through [Confluent Kafka Quickstart](https://docs.confluent.io/platform/current/quickstart/ce-docker-quickstart.html#ce-docker-quickstart) 
As alternative one could use kafka environment from [kafkajs docs](https://kafka.js.org/docs/development-environment)

2. create `./server/.env` and `./client/.env`
```sh
cp server/.env.sample server/.env && cp client/.env.sample client/.env
```
3. Run from the root directory of this repository:
```sh
docker-compose up --build
```
4. GraphQL Playground will be available at [http://localhost:4000/graphql](http://localhost:4000/graphql).
A React app will be available at [http://localhost:3000](http://localhost:3000).
 
## Characteristics

For this solution, it is helpful to view a data graph from the perspective of **state**. There are three spec-defined ways to interact with the state of a federated (or monolithic) graph:

- **Query** - Request the state of a graph at a point-in-time *without side effects*
- **Mutation** - Attempt to change state within a graph and return a specific state to the client *within well-understood side effects*
- **Subscription** - Subscribe to changes in the state of the graph in a provider-defined way

The proposed solution below is an alternative to traditional GraphQL subscription that aims to separate and address specific concerns:

- The current state of the **client**
- The current state of the **federated data graph**
- The transport and mechanism for client notification of **state changes** within the data graph

## Solution Overview

By using a custom `@_publish` [schema directive](https://spec.graphql.org/June2018/#TypeSystemDirectiveLocation) on a `Mutation` type field, an implementing service can selectively (and automatically) publish events with payloads of data (obtained from the successful mutation result) to an event store. These events may be streamed to clients using a custom `@_live` [executable directive](https://spec.graphql.org/June2018/#ExecutableDirectiveLocation) with specified query operations to trigger cache updates so that data may be added or removed from a client-side cache and user interfaces views may be re-rendered as needed. Clients must opt into what events to listen to on a per-operation basis by passing a non-null `events` argument to the `@_live` directive. To provide a measure of type safety for the events to which a client may subscribe, a shared enum type can optionally be used in the implementing services' schemas to name these events.

This approach has no specific requirements for the type of event store that’s used to save and broadcast published events. A basic in-memory pub/sub mechanism may be used or a more advanced system that indefinitely persists the event-related data may also be implemented. Ideally, events are published to the event store in an append-only log format.

Implementing services do not handle any custom logic inside resolvers to publish events to the event store. Instead, once the `@_publish` directive has been applied to a mutation in the schema, this directive will handle the event publication along including any relevant field-value pairs derived from the directive’s `payload` argument and the data returned from the successful mutation result.

This architecture also requires an additional transport layer for pushing event-related messages to clients through a persistent connection (such as a WebSocket connection or a vendor providing real-time SDKs). As events are received and processed by the GraphQL client, the client updates its cache with the newly available data and re-renders applicable user interfaces accordingly.

## Benefits

This architecture allows for the following benefits and implementation-specific adjustments to accommodate different workloads, component technologies, and transports:

- The client technology handles state management, querying, and conflict resolution
- The federated gateway is concerned only with request/response management
- Client state doesn’t need to be modelled, stored, or understood by the data graph
- Response caching can be reasoned-about as a request/response challenge
- Events published to the event store can have multiple consumers and are potentially separate from the “last mile” delivery to consumers/clients
- Side-effects of event publishing can be reasoned-about separately, e.g events that require orchestration not suited to the data graph — additional database or API lookups, cache invalidation, or other interservice communication — before delivering notifications to clients
- The transports and mechanisms for real-time client notification can be deployed, measured, and reasoned-about separately from the core data graph transport(s) (most-often HTTP-based)
- The payload of a client notification can be varied in a declarative way (in the GraphQL Schema definition), allowing for static analysis and adjustment for network/size constraints

## Assumptions

To successfully implement this architecture, the following assumptions must be satisfied by the following components:

**Implementing Services:**

- Can process schema directives added to fields

**GraphQL Client:**

- Can intercept and process executable directives added to query operations
- Has a cache for previously queried data and can handle custom caching logic

**Event Store:**

- Designed to be an architecturally separate component from the implementing services

## Other Considerations

### Communication Between Implementing Service

Implementing services may freely subscribe to events published to the event store by other services. Additional architectural considerations must be made to facilitate this communication, such as whether to use saga choreography for a separate orchestration service when handling a series of local transactions.

### Possible Use with CQRS/ES Architectures

This pattern should be well-suited for integration with CQRS/ES-based architectures.
