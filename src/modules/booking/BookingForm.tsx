import * as React from 'react';
import { Box, Stack, Input, Text, HStack, VStack, Button } from '@chakra-ui/react';
import CalenderInput from '@/components/CalendarInput';

const CostView = () => {
  return (
    <>
      <Box w='100%' fontSize='18px' bg='primary.1' mt='20px' p='10px'>
        <Text fontWeight='bold' color='white' textAlign='center'>
          TOTAL: P0000
        </Text>
      </Box>

      <Box border='1px solid' borderColor='primary.1' mt='15px' p='10px'>
        <Text>BREAKDOWN:</Text>
        <HStack mt='10px' justifyContent='space-between'>
          <Text>DAYSWIMMING:</Text>
          <Text>8,000</Text>
        </HStack>
        <HStack justifyContent='space-between'>
          <Text>ADDITIONAL ROOM (ROOM 1)</Text>
          <Text>2,000</Text>
        </HStack>
        <HStack justifyContent='space-between'>
          <Text>ADDITIONAL PAX (2)</Text>
          <Text>500</Text>
        </HStack>
      </Box>
    </>
  );
};

export interface IBookingFormProps {}

export default function BookingForm({}: IBookingFormProps) {
  return (
    <Stack direction='row' w='100%' mx='auto' justifyContent='space-between'>
      <Box w={{ base: '95%', md: '350px' }} mx={{ base: 'auto', md: '0' }}>
        <Box display={{ base: 'block', md: 'none' }} mt='20px'>
          <CalenderInput />
        </Box>

        <Stack spacing='3' mt='20px'>
          <Input placeholder='*Name' />
          <Input placeholder='*Contact Number' />
          <Input placeholder='*Email' />
        </Stack>

        <HStack mt='15px'>
          <Box h='100%' w='30%' p='-0'>
            <Input placeholder='*PAX' />
          </Box>
          <Box w='70%' fontSize='12px'>
            <Text>MAX OF 25 PAX</Text>
            <Text>EXTRA PERSON P250/HEAD</Text>
            <Text mt='10px'>CHILDREN 2 YEARS BELOW ARE FREE</Text>
            <Text>Do not add in # of pax</Text>
          </Box>
        </HStack>

        <Stack spacing='3' mt='20px'>
          <Input placeholder='*Schedule' />
          <Input placeholder='ROOM RENTAL(optional)' />
        </Stack>

        <VStack display={{ base: 'block', md: 'none' }}>
          <CostView />
        </VStack>

        <Box display='flex' justifyContent='right'>
          <Button mt='20px'>PROCEED TO PAYMENT</Button>
        </Box>
      </Box>

      <Box display={{ base: 'none', md: 'block' }}>
        <Box>
          <CalenderInput />
        </Box>

        <CostView />

        <Box display='flex' justifyContent='right'>
          <Button mt='20px'>PROCEED TO PAYMENT</Button>
        </Box>
      </Box>
    </Stack>
  );
}
