import { useMemo} from 'react';
import { InMemoryCache } from 'apollo-cache-inmemory';
import { createHttpLink } from 'apollo-link-http';
import { ApolloClient } from 'apollo-client';
import { ApolloLink } from 'apollo-link';
import { WebSocketLink } from 'apollo-link-ws';
import { getMainDefinition } from 'apollo-utilities';
import { split } from 'apollo-link';

export default settings => {
  const client = useMemo(() => {

    const cache = new InMemoryCache(); // where current data is stored
    const apolloLink = createHttpLink({ uri: '/graphql' });

    const webSocketProtol = window.location.protocol.includes('https') ? 'wss' : 'ws';
    // Create a WebSocket link:
    const wsLink = new WebSocketLink({
      uri: `${webSocketProtol}://${settings.host}:1943/graphql`,
      options: {
        reconnect: true
      },
      //webSocketImpl: WebSocket
    });

    const link = split(
      // split based on operation type
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      apolloLink
    );

    return new ApolloClient({
      cache,
      link: ApolloLink.from([link])
    });
  }, []);

  return client;
};