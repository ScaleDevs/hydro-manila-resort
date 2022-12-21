import type { AppType } from 'next/app';
import { ChakraProvider } from '@chakra-ui/react';

import { trpc } from '@/utils/trpc';
import { theme } from '@/theme';

import '../styles/globals.css';

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ChakraProvider theme={theme}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
};

export default trpc.withTRPC(MyApp);
