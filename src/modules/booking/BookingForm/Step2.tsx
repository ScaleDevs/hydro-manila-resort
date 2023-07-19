import { useState } from 'react';
import { Stack, Box, Text, VStack, Button } from '@chakra-ui/react';

import { trpc } from '@/utils/trpc';
import { NumberFieldV2 } from '@/components/NumberFieldV2';
import useBookingStoreTrack from '@/store/booking.store';
import { ChooseRoom } from './ChooseRoom';
import CostView from '../CostView';

export interface IStep2Props {
  onPrev: () => void;
  onNext: () => void;
}

export function Step2({ onPrev, onNext }: IStep2Props) {
  const { setBookingStateData, setBookingState, selectedRooms, data, selectedProduct } = useBookingStoreTrack();
  const [nonOverNightGuests, setNonOverNightGuests] = useState(data.guests.nonOverNightGuests);
  const [overNightGuests, setOverNightGuests] = useState(data.guests.overNightGuests);
  const [chosenRoomsMap, setChosenRoomsMap] = useState<typeof selectedRooms>(selectedRooms);
  const { data: bookingSetting, isLoading: bookingSettingLoader } = trpc.bookingSetting.getBookingSetting.useQuery();

  const isStepComplete = () => {
    if (!bookingSetting) return false;
    const { guests: guestSetting } = bookingSetting;
    return !!nonOverNightGuests && nonOverNightGuests > 0 && nonOverNightGuests <= guestSetting.maxNonOverNightGuestPax;
  };

  const proceed = () => {
    if (!nonOverNightGuests) return;

    setBookingStateData({
      roomIds: Array.from(chosenRoomsMap, (entry) => entry[1].roomId),
      guests: {
        nonOverNightGuests,
        overNightGuests,
      },
    });

    setBookingState('selectedRooms', chosenRoomsMap);
    onNext();
  };

  if (bookingSettingLoader || !selectedProduct || !bookingSetting) return null;

  const { guests: guestSetting } = bookingSetting;

  return (
    <Stack direction='column' spacing={5}>
      <VStack alignItems='left' spacing={2}>
        <Text fontSize='lg' fontWeight='semibold'>
          Enter number of guests (Non-Overnight):
        </Text>
        <Box h='100%' w='30%'>
          <NumberFieldV2
            onChange={(v) => {
              if (v === '') setNonOverNightGuests(0);
              else setNonOverNightGuests(parseInt(v, 10));
            }}
            value={`${nonOverNightGuests}`}
            property='nonOverNightGuests'
          />
        </Box>
        <Box w='70%' fontSize='12px' lineHeight={1.5}>
          <Text color='gray.400'>
            MAX OF {guestSetting.minNonOverNightGuestPax} PAX. EXTRA PERSON ₱{guestSetting.nonOverNightGuestFee}/HEAD
          </Text>
          <Text color='gray.400'>CHILDREN 2 YEARS BELOW ARE FREE Do not add in # of pax</Text>
        </Box>
        <Stack w='100%'>
          <Text color='red.500' textAlign='left'>
            {nonOverNightGuests > guestSetting.maxNonOverNightGuestPax &&
              `Extra Heads Allowed are only ${guestSetting.maxNonOverNightGuestPax - guestSetting.minNonOverNightGuestPax}!`}
          </Text>
        </Stack>
      </VStack>

      {guestSetting.minOverNightGuestPax > 0 && (
        <VStack alignItems='left' spacing={2}>
          <Text fontSize='lg' fontWeight='semibold'>
            Enter number of guests (Overnight):
          </Text>
          <Box h='100%' w='30%'>
            <NumberFieldV2
              onChange={(v) => {
                if (v === '') setOverNightGuests(0);
                else setOverNightGuests(parseInt(v, 10));
              }}
              value={`${overNightGuests}`}
              property='overNightGuests'
            />
          </Box>
          <Box w='70%' fontSize='12px' lineHeight={1.5}>
            <Text color='gray.400'>
              MAX OF {guestSetting.minOverNightGuestPax} PAX. EXTRA PERSON ₱{guestSetting.overNightGuestFee}/HEAD
            </Text>
            <Text color='gray.400'>CHILDREN 2 YEARS BELOW ARE FREE Do not add in # of pax</Text>
          </Box>
          <Stack w='100%'>
            <Text color='red.500' textAlign='left'>
              {overNightGuests > guestSetting.maxOverNightGuestPax
                ? `Extra Heads Allowed are only ${guestSetting.maxOverNightGuestPax - guestSetting.minOverNightGuestPax}!`
                : ''}
            </Text>
          </Stack>
        </VStack>
      )}

      <ChooseRoom chosenSchedule={selectedProduct} chosenRoomsMap={chosenRoomsMap} setChosenRoomsMap={setChosenRoomsMap} />

      <Stack direction='row' justifyContent='flex-end'>
        <Box w='400px'>
          <CostView
            guests={{
              nonOverNightGuests,
              overNightGuests,
            }}
            product={selectedProduct}
            rooms={Array.from(chosenRoomsMap, (entry) => entry[1])}
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
