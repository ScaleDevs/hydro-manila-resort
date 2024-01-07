import type { AppType } from 'next/app';
import { Box, Text, ChakraProvider, chakra, HStack } from '@chakra-ui/react';
import { BsFillPatchCheckFill, BsPatchExclamationFill, BsInfoCircleFill } from 'react-icons/bs';

import { trpc } from '@/utils/trpc';
import { theme } from '@/theme';

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

import '../styles/globals.css';

const CheckIcon = chakra(BsFillPatchCheckFill);
const ErrorIcon = chakra(BsPatchExclamationFill);
const DefaultIcon = chakra(BsInfoCircleFill);

const MyApp: AppType = ({ Component, pageProps }) => {
  const toastRender: any = {
    success: {
      bg: 'green.200',
      color: 'green.700',
      Icon: () => <CheckIcon size={25} color='green.800' />,
    },
    error: {
      bg: 'red.200',
      color: 'red.700',
      Icon: () => <ErrorIcon size={25} color='red.800' />,
    },
  };

  return (
    <ChakraProvider
      theme={theme}
      toastOptions={{
        defaultOptions: {
          render(props) {
            return (
              <Box
                bg={props.status ? toastRender[props.status].bg : 'blue.300'}
                fontFamily='primary'
                padding='15px'
                borderRadius='md'
                _hover={{
                  cursor: 'pointer',
                }}
                onClick={props.onClose}
              >
                <HStack>
                  {props.status ? toastRender[props.status].Icon() : <DefaultIcon size={25} color='blue.800' />}
                  <Text color={props.status ? toastRender[props.status].color : 'black'}>{props.title}</Text>
                </HStack>
              </Box>
            );
          },
        },
      }}
    >
      <Component {...pageProps} />
    </ChakraProvider>
  );
};

export default trpc.withTRPC(MyApp);
