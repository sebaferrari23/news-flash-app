import React from 'react';
import { StatusBar } from 'react-native';
import {
  createClient,
  Provider as UrqlProvider,
  dedupExchange,
  fetchExchange,
  Exchange,
  makeErrorResult,
} from 'urql';
import { NavigationContainer } from '@react-navigation/native';
import { RootNavigator } from './screens/Root.navigator';
import { offlineExchange } from '@urql/exchange-graphcache';
import schema from './graphql/graphql.schema.json';
import {
  AddBookmarkMutation,
  AllBookmarksQuery,
} from './graphql/__generated__/operationTypes';
import { BOOKMARKS_QUERY } from './screens/Bookmarks.screen';
import { gql } from 'urql';
import {
  RemoveBookmarkMutation,
  RemoveBookmarkMutationVariables,
} from './graphql/__generated__/operationTypes';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
//import { AppOfflinePage } from './components/AppOfflinePage';
import { AppOfflineMessage } from './components/AppOfflineMessage';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { makeAsyncStorage } from '@urql/storage-rn';
import { share, pipe, filter, map, merge } from 'wonka';

let disconnect: any;

const offlineMutationExchange: () => Exchange = () => {
  let connected = true;

  if (disconnect) {
    disconnect();
    disconnect = undefined;
  }

  disconnect = NetInfo.addEventListener(state => {
    connected = state.isConnected === true;
  });

  return ({ forward }) => {
    return ops$ => {
      const shared = pipe(ops$, share);

      // mutations when is offline
      const offlineMutations = pipe(
        shared,
        filter(op => op.kind === 'mutation' && !connected),
        map(op => makeErrorResult(op, new Error('You are offline!'))),
      );

      // everything else
      const rest = pipe(
        shared,
        filter(
          op => op.kind !== 'mutation' || (op.kind === 'mutation' && connected),
        ),
      );

      return merge([forward(rest), offlineMutations]);
    };
  };
};

const storage = makeAsyncStorage({
  dataKey: 'my-app-data',
  metadataKey: 'my-app-metadata',
  maxAge: 5,
});

const client = createClient({
  url: 'http://localhost:3000/graphql',
  exchanges: [
    dedupExchange,
    offlineExchange({
      storage,
      schema: schema as any,
      resolvers: {
        Query: {
          story: (_, args) => ({ __typename: 'Story', id: args.id }),
        },
      },
      updates: {
        Mutation: {
          addBookmark: (result: AddBookmarkMutation, args, cache) => {
            if (result.addBookmark) {
              cache.updateQuery(
                { query: BOOKMARKS_QUERY },
                (data: AllBookmarksQuery | null) => {
                  if (data && data.bookmarks && result.addBookmark) {
                    data.bookmarks.push(result.addBookmark);
                  }
                  return data;
                },
              );
            }
          },
          removeBookmark: (
            result: RemoveBookmarkMutation,
            args: RemoveBookmarkMutationVariables,
            cache,
          ) => {
            if (result.removeBookmark) {
              let storyId = null;
              cache.updateQuery(
                { query: BOOKMARKS_QUERY },
                (data: AllBookmarksQuery | null) => {
                  if (data?.bookmarks) {
                    storyId = data.bookmarks.find(
                      item => item.id === args.bookmarkId,
                    )?.story.id;
                    data.bookmarks = data.bookmarks.filter(
                      item => item.id !== args.bookmarkId,
                    );
                  }
                  return data;
                },
              );

              if (storyId) {
                const fragment = gql`
                  fragment _ on Story {
                    id
                    bookmarkId
                  }
                `;
                cache.writeFragment(fragment, {
                  id: storyId,
                  bookmarkId: null,
                });
              }
            }
          },
        },
      },
    }),
    offlineMutationExchange(),
    fetchExchange,
  ],
});

export const App: React.FC = () => {
  const { isConnected } = useNetInfo();

  // if (!isConnected) {
  //   return <AppOfflinePage />;
  // }

  return (
    <SafeAreaProvider>
      <UrqlProvider value={client}>
        <NavigationContainer>
          <StatusBar hidden />
          <RootNavigator />
        </NavigationContainer>
        {isConnected === false ? <AppOfflineMessage /> : null}
      </UrqlProvider>
    </SafeAreaProvider>
  );
};
