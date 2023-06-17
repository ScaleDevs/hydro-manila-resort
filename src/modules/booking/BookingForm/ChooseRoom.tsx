import * as React from 'react';
import { Box, Stack, Text } from '@chakra-ui/react';

export interface IChooseRoomProps {}

export function ChooseRoom (props: IChooseRoomProps) {
  return (
    <Box w='100%' mx='auto'>
      <Text fontSize='lg' fontWeight='semibold'>Choose Rooms:</Text>
      <br />
      <Stack direction='column' justifyContent={{ base: 'start', md: 'center' }} alignItems='center' spacing={1.5} mx='auto' overflowX='auto'>
        <Stack direction='row' bg='blackAlpha.200' borderRadius='10px' w='100%' py='7' justifyContent='space-around' cursor='pointer' _hover={{ bg: 'blackAlpha.300' }} transition='background-color 0.25s'>
          <Text textAlign='center' fontSize={{ base: 'xs', sm: 'sm', lg: 'md'}} fontWeight='semibold'>ROOM 1</Text>
          <Text textAlign='center' fontSize={{ base: 'xs', sm: 'sm', lg: 'md'}} fontWeight='semibold'>w/o bathroom</Text>
          <Text textAlign='center' fontSize={{ base: 'xs', sm: 'sm', lg: 'md'}} fontWeight='semibold'>₱2,000</Text>
        </Stack>
        <Stack direction='row' bg='blackAlpha.200' borderRadius='10px' w='100%' py='7' justifyContent='space-around' cursor='pointer' _hover={{ bg: 'blackAlpha.300' }} transition='background-color 0.25s'>
          <Text textAlign='center' fontSize={{ base: 'xs', sm: 'sm', lg: 'md'}} fontWeight='semibold'>ROOM 2</Text>
          <Text textAlign='center' fontSize={{ base: 'xs', sm: 'sm', lg: 'md'}} fontWeight='semibold'>w/ bathroom</Text>
          <Text textAlign='center' fontSize={{ base: 'xs', sm: 'sm', lg: 'md'}} fontWeight='semibold'>₱2,500</Text>
        </Stack>
      </Stack>
    </Box>
  );
}
