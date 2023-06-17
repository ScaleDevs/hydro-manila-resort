import * as React from 'react';
import { Box, Stack, Text, chakra } from '@chakra-ui/react';
import { BsChevronLeft, BsChevronRight } from 'react-icons/bs';

const LeftArrowIcon = chakra(BsChevronLeft);
const RightArrowIcon = chakra(BsChevronRight);

export interface IChooseDateProps {}

export function ChooseDate (props: IChooseDateProps) {
  return (
    <Box w='100%' mx='auto'>
      <Text fontSize='lg' fontWeight='semibold'>Choose Date - <Text as='span' color='gray.400' fontWeight='normal'>May 2023</Text></Text>
      <Stack p='5' direction='row' justifyContent={{ base: 'start', md: 'center' }} alignItems='center' spacing={4} mx='auto' overflowX='auto'>
        <Box>
          <LeftArrowIcon _hover={{ cursor: 'pointer' }} color='gray.500' w='20px' h='20px' />
        </Box>
        <Box bg='#FBFBFB' borderRadius='10px' boxShadow='md' border="1px" borderColor="gray.200" minW={{ base: '80px', lg: '100px' }} h='90px' p={5} cursor='pointer' _hover={{ bg: 'gray.100' }} transition='background-color 0.25s'>
          <Text textAlign='center' color='gray.400' fontSize={{ base: 'sm', lg: 'md' }}>Mon</Text>
          <Text textAlign='center' color='gray.500' fontSize={{ base: 'sm', lg: 'md'}}>15</Text>
        </Box>
        <Box bg='#FBFBFB' borderRadius='10px' boxShadow='md' border="1px" borderColor="gray.200" minW={{ base: '80px', lg: '100px' }} h='90px' p={5} cursor='pointer' _hover={{ bg: 'gray.100' }} transition='background-color 0.25s'>
          <Text textAlign='center' color='gray.400' fontSize={{ base: 'sm', lg: 'md' }}>Tue</Text>
          <Text textAlign='center' color='gray.500' fontSize={{ base: 'sm', lg: 'md'}}>15</Text>
        </Box>
        <Box bg='#FBFBFB' borderRadius='10px' boxShadow='md' border="1px" borderColor="gray.200" minW={{ base: '80px', lg: '100px' }} h='90px' p={5} cursor='pointer' _hover={{ bg: 'gray.100' }} transition='background-color 0.25s'>
          <Text textAlign='center' color='gray.400' fontSize={{ base: 'sm', lg: 'md' }}>Wed</Text>
          <Text textAlign='center' color='gray.500' fontSize={{ base: 'sm', lg: 'md'}}>15</Text>
        </Box>
        <Box bg='#FBFBFB' borderRadius='10px' boxShadow='md' border="1px" borderColor="gray.200" minW={{ base: '80px', lg: '100px' }} h='90px' p={5} cursor='pointer' _hover={{ bg: 'gray.100' }} transition='background-color 0.25s'>
          <Text textAlign='center' color='gray.400' fontSize={{ base: 'sm', lg: 'md' }}>Thu</Text>
          <Text textAlign='center' color='gray.500' fontSize={{ base: 'sm', lg: 'md'}}>15</Text>
        </Box><Box bg='#FBFBFB' borderRadius='10px' boxShadow='md' border="1px" borderColor="gray.200" minW={{ base: '80px', lg: '100px' }} h='90px' p={5} cursor='pointer' _hover={{ bg: 'gray.100' }} transition='background-color 0.25s'>
          <Text textAlign='center' color='gray.400' fontSize={{ base: 'sm', lg: 'md' }}>Fri</Text>
          <Text textAlign='center' color='gray.500' fontSize={{ base: 'sm', lg: 'md'}}>15</Text>
        </Box>
        <Box bg='#FBFBFB' borderRadius='10px' boxShadow='md' border="1px" borderColor="gray.200" minW={{ base: '80px', lg: '100px' }} h='90px' p={5} cursor='pointer' _hover={{ bg: 'gray.100' }} transition='background-color 0.25s'>
          <Text textAlign='center' color='gray.400' fontSize={{ base: 'sm', lg: 'md' }}>Sat</Text>
          <Text textAlign='center' color='gray.500' fontSize={{ base: 'sm', lg: 'md'}}>15</Text>
        </Box>
        <Box>
          <RightArrowIcon  _hover={{ cursor: 'pointer' }} color='gray.500' w='20px' h='20px' />
        </Box>
      </Stack>
    </Box>
  );
}
