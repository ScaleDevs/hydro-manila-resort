import React from 'react';
import { Box, Stack, Image, Container } from '@chakra-ui/react';

export default function Layout({ children }: any) {
  return (
    <Box bg='primary.3' height='100vh'>
      <Box w='100%' py='0' bg='primary.1'>
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
          <Image src='/logo_white.png' alt='Hydro Resort Logo' />
        </Stack>
      </Box>
      <Container maxW='container.xl'>{children}</Container>
    </Box>
  );
}
