import type { AppType } from 'next/app';
import { ChakraProvider } from '@chakra-ui/react';
import { withTRPC } from '@trpc/next';
import { loggerLink } from '@trpc/client/links/loggerLink';
import { httpBatchLink } from '@trpc/client/links/httpBatchLink';
import superjson from 'superjson';

import { theme } from '@/theme';
import { AppRouter } from '@/server/routers/_app';
import { useAuthStore } from '@/store/auth.store';

import '../styles/globals.css';

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ChakraProvider theme={theme}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
};

export default withTRPC<AppRouter>({
  config() {
    const url = '/api/trpc';

    const links = [
      loggerLink(),
      httpBatchLink({
        maxBatchSize: 10,
        url,
      }),
    ];

    return {
      headers() {
        return {
          Authorization: 'Bearer ' + useAuthStore.getState().accessToken,
        };
      },
      links,
      transformer: superjson,
      queryClientConfig: {
        defaultOptions: {
          queries: {
            staleTime: 60,
          },
        },
      },
    };
  },
  ssr: false,
})(MyApp);
