import React from 'react';
import { Box, HStack, VStack, Heading, Avatar } from '@chakra-ui/react';

import AuthGuard from '@/components/AuthGuard';
import AdminNav from '@/components/AdminNav';

export default function Layout({ children }: any) {
  return (
    <AuthGuard>
      <HStack bg='primary.2' height='100vh' overflowY='auto' spacing={0} position='relative'>
        <AdminNav />
        <Box
          h='100%'
          w={{ base: '100%', md: '95%', lg: '100%' }}
          px={{ base: '20px', sm: '20px', md: '40px', lg: '50px', xl: '90px' }}
          pt='80px'
          position='relative'
        >
          <VStack w='100%'>
            <HStack w='100%' justifyContent='right'>
              <Heading>ADMIN</Heading>
              <Avatar />
            </HStack>
            <br />
            {children}
          </VStack>
        </Box>
      </HStack>
    </AuthGuard>
  );
}
