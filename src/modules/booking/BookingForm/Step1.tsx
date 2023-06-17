import * as React from 'react';
import { Stack, Heading, Button, Box } from '@chakra-ui/react';
import CostView from '../CostView';
import { ChooseDate } from './ChooseDate';
import { ChooseSchedule } from './ChooseTime';

export interface IStep1Props {}

export function Step1 (props: IStep1Props) {
  return (
    <Stack direction='column' spacing={5}>
      <Heading size='lg'>Date & Time</Heading>
      <ChooseDate />
      <ChooseSchedule />
      <Stack direction='row' justifyContent='flex-end'>
        <Box w='300px'>
          <CostView guests={26} />
        </Box>
      </Stack>
      <Stack direction='row' justifyContent='flex-end'>
        <Button>
          Proceed
        </Button>
      </Stack>
    </Stack>
  );
}
