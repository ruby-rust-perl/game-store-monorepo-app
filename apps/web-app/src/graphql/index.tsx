import { ApolloClient, from, HttpLink, InMemoryCache } from '@apollo/client';
import { onError } from '@apollo/client/link/error';
import { RawgGameResponse } from '@game-store-monorepo/data-access';
import { toastError } from 'src/components/Toast';

const errorLink = onError(({ graphQLErrors, networkError }) => {
  toastError({
    content: (
      <div>
        {networkError && <p className="font-bold text-sm mb-2">{networkError.message}</p>}
        <ul>
          {graphQLErrors?.map(({ message }) => {
            return <li className="text-sm text-gray-300">{message}</li>;
          })}
        </ul>
      </div>
    ),
  });
});

const httpLink = new HttpLink({
  uri: process.env.NX_API_URL,
});

export const client = new ApolloClient({
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          allGames: {
            read(existing) {
              return existing;
            },
            keyArgs: ['dates'],
            merge(existing: RawgGameResponse, incoming: RawgGameResponse, { args }): RawgGameResponse {
              if (!existing) {
                return incoming;
              }

              return {
                ...existing,
                nextPage: incoming.nextPage,
                results: [...existing.results, ...incoming.results],
              };
            },
          },
        },
      },
    },
  }),
  link: from([errorLink, httpLink]),
});