import React from 'react';
import { StatusBar } from 'react-native';
import {
  createClient,
  Provider as UrqlProvider,
  dedupExchange,
  fetchExchange,
} from 'urql';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './screens/Root.navigator';
import { cacheExchange } from '@urql/exchange-graphcache';
import schema from './graphql/graphql.schema.json';

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [
    dedupExchange,
    cacheExchange({
      schema: schema as any,
      resolvers: {
        Query: {
          story: (_, args) => ({ __typename: 'Story', id: args.id }),
        },
      },
    }),
    fetchExchange,
  ],
});

export const App: React.FC = () => {
  return (
    <UrqlProvider value={client}>
      <NavigationContainer>
        <StatusBar hidden />
        <RootNavigator />
      </NavigationContainer>
    </UrqlProvider>
  );
};
