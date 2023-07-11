import { useState } from 'react';
import { Stack, Box, Text, VStack, Button } from '@chakra-ui/react';

import { trpc } from '@/utils/trpc';
import { IRoom } from '@/utils/types';
import { NumberFieldV2 } from '@/components/NumberFieldV2';
import useBookingStoreTrack from '@/store/booking.store';
import { ChooseRoom } from './ChooseRoom';
import CostView from '../CostView';

export interface IStep2Props {
  onPrev: () => void;
  onNext: () => void;
}

export function Step2({ onPrev, onNext }: IStep2Props) {
  const { setBookingStateData, setBookingState, selectedRoom, data } = useBookingStoreTrack();
  const [guests, setGuests] = useState(data.guests);
  const [chosenRoom, setChosenRoom] = useState<IRoom | null>(selectedRoom);
  const { data: bookingSetting, isLoading: bookingSettingLoader } = trpc.bookingSetting.getBookingSetting.useQuery();

  const isStepComplete = () => {
    return !!guests && guests > 0 && bookingSetting && guests <= bookingSetting.maxPax;
  };

  const proceed = () => {
    if (!guests) return;

    setBookingStateData({
      roomId: chosenRoom?.roomId || null,
      guests,
    });

    setBookingState('selectedRoom', chosenRoom);
    onNext();
  };

  if (bookingSettingLoader) return null;

  return (
    <Stack direction='column' spacing={5}>
      <VStack alignItems='left' spacing={2}>
        <Text fontSize='lg' fontWeight='semibold'>
          Enter number of guests:
        </Text>
        <Box h='100%' w='30%'>
          <NumberFieldV2 onChange={(v) => setGuests(parseInt(v, 10))} value={`${guests}`} />
        </Box>
        <Box w='70%' fontSize='12px' lineHeight={1.5}>
          <Text color='gray.400'>
            MAX OF {bookingSetting?.minPax || 25} PAX EXTRA PERSON ₱{bookingSetting?.extraHeadFee || 250}/HEAD
          </Text>
          <Text color='gray.400'>CHILDREN 2 YEARS BELOW ARE FREE Do not add in # of pax</Text>
        </Box>
        <Stack w='100%'>
          <Text color='red.500' textAlign='left'>
            {bookingSetting && guests > bookingSetting.maxPax
              ? `Extra Heads Allowed are only ${bookingSetting.maxPax - bookingSetting.minPax}!`
              : ''}
          </Text>
        </Stack>
      </VStack>

      <ChooseRoom chosenRoom={chosenRoom} setChosenRoom={setChosenRoom} />

      <Stack direction='row' justifyContent='flex-end'>
        <Box w='400px'>
          <CostView
            guests={guests || data.guests}
            bookedDate={data.bookingDate || undefined}
            productId={data.productId}
            roomId={chosenRoom?.roomId || data.roomId}
          />
        </Box>
      </Stack>

      <Stack direction='row' justifyContent='space-between'>
        <Button onClick={onPrev}>Back</Button>
        <Button disabled={isStepComplete()} cursor={isStepComplete() ? 'pointer' : 'not-allowed'} onClick={proceed}>
          Proceed
        </Button>
      </Stack>
    </Stack>
  );
}
