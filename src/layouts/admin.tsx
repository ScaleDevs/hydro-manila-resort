import React from 'react';
import { Box, Stack, Image, Container } from '@chakra-ui/react';
import AuthGuard from '@/components/AuthGuard';

export default function Layout({ children }: any) {
  return (
    <AuthGuard>
      <Box bg='primary.2' height='100vh'>
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
        <Container maxW='container.xl'>{children}</Container>
      </Box>
    </AuthGuard>
  );
}
