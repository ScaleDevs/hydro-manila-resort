import React from 'react';
import { Box, Stack, Image } from '@chakra-ui/react';

export default function Layout({ children }: any) {
  return (
    <Box bg='primary.2' height='100vh' overflowY='auto'>
      <Box w='100%' py='0' bg='primary.1' pos='relative'>
        <Stack
          maxW='container.xl'
          direction='row'
          h='90px'
          w='100%'
          mx='auto'
          justifyContent='center'
          gap='10'
          textColor='whiteAlpha.800'
        >
          <Image
            src='/logo_white.png'
            alt='Hydro Resort Logo'
            h={{ base: '150px', xl: '200px' }}
            marginTop={{ base: '-30px', xl: '-60px' }}
          />
        </Stack>
      </Box>
      <Box w='100%' maxW={{ lg: 'container.xl' }} mx='auto'>
        {children}
      </Box>
    </Box>
  );
}
