import type { AppType } from 'next/app';
import { ChakraProvider } from '@chakra-ui/react';

import { trpc } from '@/utils/trpc';
import { theme } from '@/theme';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

import '../styles/globals.css';

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <ChakraProvider theme={theme}>
      <Component {...pageProps} />
    </ChakraProvider>
  );
};

export default trpc.withTRPC(MyApp);
