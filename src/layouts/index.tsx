import React from 'react';
import { Box, Stack, Text, Container } from '@chakra-ui/react';

export default function Layout({ children }: any) {
  return (
    <Box bg='primary.3' height='100vh'>
      <Box w='100%' py='15px' bg='primary.1'>
        <Stack maxW='container.xl' direction='row' w='100%' justifyContent='flex-end' gap='10' textColor='whiteAlpha.800'>
          <Text>Head1</Text>
          <Text>Head2</Text>
          <Text>Head3</Text>
        </Stack>
      </Box>
      <Container maxW='container.xl'>{children}</Container>
    </Box>
  );
}
