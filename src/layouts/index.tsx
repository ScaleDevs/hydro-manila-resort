import React from 'react';
import Image from 'next/image';
import { Box, Stack } from '@chakra-ui/react';

export default function Layout({ children }: any) {
  return (
    <Box bg='primary.2' height='100vh' overflowY='auto'>
      <Box h='100px' w='100%' py='0' bg='primary.1' pos='relative'>
        <Stack
          maxW='container.xl'
          direction='row'
          w='100%'
          mx='auto'
          justifyContent='center'
          gap='10'
          textColor='whiteAlpha.800'
          position='absolute'
          mt='-57px'
          left='50%'
          transform='translateX(-50%)'
        >
          <Image src='/logo_white.png' alt='Hydro Resort Logo' width={200} height={200} priority />
        </Stack>
      </Box>
      <Box w='100%' maxW={{ lg: 'container.xl' }} mx='auto'>
        {children}
      </Box>
    </Box>
  );
}
