import * as React from 'react';
import { Box, Stack, Text } from '@chakra-ui/react';

export interface IChooseScheduleProps {}

export function ChooseSchedule (props: IChooseScheduleProps) {
  return (
    <Box w='100%' mx='auto'>
      <Text fontSize='lg' fontWeight='semibold'>Choose Time:</Text>
      <br />
      <Stack direction='column' justifyContent={{ base: 'start', md: 'center' }} alignItems='center' spacing={1.5} mx='auto' overflowX='auto'>
        <Stack direction='row' bg='blackAlpha.200' borderRadius='10px' w='100%' py='7' justifyContent='space-around' cursor='pointer' _hover={{ bg: 'blackAlpha.300' }} transition='background-color 0.25s'>
          <Text textAlign='center' fontSize={{ base: 'xs', sm: 'sm', lg: 'md'}} fontWeight='semibold'>9:00 AM - 5:00 PM</Text>
          <Text textAlign='center' fontSize={{ base: 'xs', sm: 'sm', lg: 'md'}} fontWeight='semibold'>NO ROOMS</Text>
          <Text textAlign='center' fontSize={{ base: 'xs', sm: 'sm', lg: 'md'}} fontWeight='semibold'>₱8,000</Text>
        </Stack>
        <Stack direction='row' bg='blackAlpha.200' borderRadius='10px' w='100%' py='7' justifyContent='space-around' cursor='pointer' _hover={{ bg: 'blackAlpha.300' }} transition='background-color 0.25s'>
          <Text textAlign='center' fontSize={{ base: 'xs', sm: 'sm', lg: 'md'}} fontWeight='semibold'>8:00 PM - 6:00 AM</Text>
          <Text textAlign='center' fontSize={{ base: 'xs', sm: 'sm', lg: 'md'}} fontWeight='semibold'>NO ROOMS</Text>
          <Text textAlign='center' fontSize={{ base: 'xs', sm: 'sm', lg: 'md'}} fontWeight='semibold'>₱12,000</Text>
        </Stack>
        <Stack direction='row' bg='blackAlpha.200' borderRadius='10px' w='100%' py='7' justifyContent='space-around' cursor='pointer' _hover={{ bg: 'blackAlpha.300' }} transition='background-color 0.25s'>
          <Text textAlign='center' fontSize={{ base: 'xs', sm: 'sm', lg: 'md'}} fontWeight='semibold'>9:00 AM - 6:00 AM</Text>
          <Text textAlign='center' fontSize={{ base: 'xs', sm: 'sm', lg: 'md'}} fontWeight='semibold'>NO ROOMS</Text>
          <Text textAlign='center' fontSize={{ base: 'xs', sm: 'sm', lg: 'md'}} fontWeight='semibold'>₱20,000</Text>
        </Stack>
        <Stack direction='row' bg='blackAlpha.200' borderRadius='10px' w='100%' py='7' justifyContent='space-around' cursor='pointer' _hover={{ bg: 'blackAlpha.300' }} transition='background-color 0.25s'>
          <Text textAlign='center' fontSize={{ base: 'xs', sm: 'sm', lg: 'md'}} fontWeight='semibold'>8:00 PM - 5:00 PM</Text>
          <Text textAlign='center' fontSize={{ base: 'xs', sm: 'sm', lg: 'md'}} fontWeight='semibold'>WITH ROOMS</Text>
          <Text textAlign='center' fontSize={{ base: 'xs', sm: 'sm', lg: 'md'}} fontWeight='semibold'>₱20,000</Text>
        </Stack>
      </Stack>
    </Box>
  );
}
