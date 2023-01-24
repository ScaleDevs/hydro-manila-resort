import React from 'react';
import { Box, Stack, Image, Container, Center, Button } from '@chakra-ui/react';

import { useLogout } from '@/modules/hooks/useLogout.hook';
import AuthGuard from '@/components/AuthGuard';
import Link from 'next/link';

export default function Layout({ children }: any) {
  const { signOutWithMutate } = useLogout();

  return (
    <AuthGuard>
      <Box bg='primary.2' height='100vh'>
        <Box w='100%' py='0' bg='primary.1' pos='relative'>
          <Stack direction='row' h='90px' w='100%' justifyContent='space-between' gap='10' textColor='whiteAlpha.800'>
            <Box>
              <Image
                src='/logo_white.png'
                alt='Hydro Resort Logo'
                h={{ base: '150px', xl: '200px' }}
                marginTop={{ base: '-30px', xl: '-60px' }}
              />
            </Box>

            <Center p={{ base: '10px', md: '30px' }}>
              <Link href='/admin/bookings'>
                <Button fontWeight='normal' fontSize={{ base: '14px', md: '20px' }}>
                  BOOKING RECORDS
                </Button>
              </Link>
              <Link href='/admin/products'>
                <Button fontWeight='normal' fontSize={{ base: '14px', md: '20px' }}>
                  PRODUCTS
                </Button>
              </Link>
              <Button fontWeight='normal' fontSize={{ base: '14px', md: '20px' }} onClick={() => signOutWithMutate()}>
                LOGOUT
              </Button>
            </Center>
          </Stack>
        </Box>
        <Container maxW='container.xl'>{children}</Container>
      </Box>
    </AuthGuard>
  );
}
