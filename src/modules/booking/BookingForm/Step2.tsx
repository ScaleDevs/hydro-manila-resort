import * as React from 'react';
import { Stack, Box, Text, VStack, Button } from '@chakra-ui/react';

import { trpc } from '@/utils/trpc';
import { NumberField } from '@/components/NumberField';
import { ChooseRoom } from './ChooseRoom';
import CostView from '../CostView';

export interface IStep2Props {
}

export function Step2 (props: IStep2Props) {
  const { data: bookingSetting, isLoading: bookingSettingLoader } = trpc.bookingSetting.getBookingSetting.useQuery();

  if (bookingSettingLoader) return null;
  
  return (
    <Stack direction='column' spacing={5}>
      <VStack alignItems='left' spacing={2}>
          <Text fontSize='lg' fontWeight='semibold'>Enter number of guests:</Text>
          <Box h='100%' w='30%'>
            <NumberField property='guests' placeholder='*PAX' />
          </Box>
          <Box w='70%' fontSize='12px' lineHeight={1.5}>
            <Text color='gray.400'>MAX OF {bookingSetting?.minPax || 25} PAX EXTRA PERSON ₱{bookingSetting?.extraHeadFee || 250}/HEAD</Text>
            <Text color='gray.400'>CHILDREN 2 YEARS BELOW ARE FREE Do not add in # of pax</Text>
          </Box>
        {/* <Stack w='100%'>
          <Text color='red.500' textAlign='left'>
            {errors.guests?.message ||
              (bookingSetting
                ? watch('guests') > bookingSetting.maxPax
                  ? `Extra Heads Allowed are only ${bookingSetting.maxPax - bookingSetting.minPax}!`
                  : ''
                : '')}
          </Text>
        </Stack> */}
      </VStack>

      <ChooseRoom />

      <Stack direction='row' justifyContent='flex-end'>
        <Box w='300px'>
          <CostView guests={26} />
        </Box>
      </Stack>
      
      <Stack direction='row' justifyContent='space-between'>
        <Button>
          Back
        </Button>
        <Button>
          Proceed
        </Button>
      </Stack>
    </Stack>
  );
}
