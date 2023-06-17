import * as React from 'react';
import { Box } from '@chakra-ui/react';
import { Step1 } from './Step1';
import { Step2 } from './Step2';
import { Step3 } from './Step3';
import { Step4 } from './Step4';

export interface IBookingFormV2Props {}

export function BookingFormV2 (props: IBookingFormV2Props) {
  return (
    <Box w={{ base: '90%', md: '90%', lg: '80%' }} mx='auto'>
      <Step4 />
    </Box>
  );
}
