import { useState } from 'react';
import { Stack, Box, Text, VStack, Button } from '@chakra-ui/react';

import { NumberFieldV2 } from '@/components/NumberFieldV2';
import useBookingStoreTrack from '@/store/booking.store';
import { ChooseRoom } from '../components/ChooseRoom';
import CostView from '../components/CostView';
import { getPromo } from '@/utils/helper';

export interface IStep2Props {
  onPrev: () => void;
  onNext: () => void;
}

export function Step2({ onPrev, onNext }: IStep2Props) {
  const { setBookingStateData, setBookingState, selectedRooms, selectedProduct, data, freeGuests } = useBookingStoreTrack();
  const [nonOverNightGuests, setNonOverNightGuests] = useState(
    !!selectedProduct?.scheduleEndNextDay && !!selectedProduct.isAllRooms
      ? data.guests.nonOverNightGuests
      : data.guests.nonOverNightGuests - freeGuests,
  );
  const [overNightGuests, setOverNightGuests] = useState(
    !!selectedProduct?.scheduleEndNextDay && !!selectedProduct.isAllRooms ? data.guests.overNightGuests - freeGuests : 0,
  );
  const [guests, setGuests] = useState(freeGuests);
  const [chosenRoomsMap, setChosenRoomsMap] = useState<typeof selectedRooms>(selectedRooms);

  const isStepComplete = () => {
    if (!selectedProduct) return false;
    const { guestSetting, scheduleEndNextDay, isAllRooms } = selectedProduct;
    const freeGuestMax =
      !!scheduleEndNextDay && !!isAllRooms ? guestSetting.minOverNightGuestPax : guestSetting.minNonOverNightGuestPax;

    return (
      guests > 0 &&
      guests <= freeGuestMax &&
      overNightGuests <= guestSetting.maxOverNightGuestPax - guestSetting.minOverNightGuestPax &&
      nonOverNightGuests <= guestSetting.maxNonOverNightGuestPax - guestSetting.minNonOverNightGuestPax
    );
  };

  const proceed = () => {
    if (!guests || !selectedProduct) return;

    const { scheduleEndNextDay, isAllRooms } = selectedProduct;

    setBookingStateData({
      roomIds: Array.from(chosenRoomsMap, (entry) => entry[1].roomId),
      guests: {
        nonOverNightGuests: !!scheduleEndNextDay && !!isAllRooms ? nonOverNightGuests : nonOverNightGuests + guests,
        overNightGuests: !!scheduleEndNextDay && !!isAllRooms ? overNightGuests + guests : 0,
      },
    });
    setBookingState('freeGuests', guests);
    setBookingState('selectedRooms', chosenRoomsMap);
    onNext();
  };

  if (!selectedProduct) return null;
  const { guestSetting, scheduleEndNextDay, isAllRooms } = selectedProduct;
  const isAdditionalInputsDisabled = () =>
    guests < (!!scheduleEndNextDay && !!isAllRooms ? guestSetting.minOverNightGuestPax : guestSetting.minNonOverNightGuestPax);
  const getMainMin = () =>
    !!scheduleEndNextDay && !!isAllRooms ? guestSetting.minOverNightGuestPax : guestSetting.minNonOverNightGuestPax;
  const currentPromo = getPromo(data.bookingDate, selectedProduct);
  const extraHeadsTotalNonOvernight = guestSetting.maxNonOverNightGuestPax - guestSetting.minNonOverNightGuestPax;
  const extraHeadsTotalOvernight = guestSetting.maxOverNightGuestPax - guestSetting.minOverNightGuestPax;

  return (
    <Stack direction='column' spacing={5}>
      <VStack alignItems='left' spacing={2}>
        <Text fontSize='lg' fontWeight='semibold'>
          Enter number of guests:
        </Text>
        <Box h='100%' w='30%'>
          <NumberFieldV2
            maxValue={getMainMin()}
            onChange={(v) => {
              if (v === '') setGuests(0);
              else {
                const value = parseInt(v, 10);
                if (value < getMainMin()) {
                  setNonOverNightGuests(0);
                  setOverNightGuests(0);
                }
                setGuests(value);
              }
            }}
            value={`${guests}`}
            property='guests'
          />
        </Box>
        <Box w='70%' fontSize='12px' lineHeight={1.5}>
          <Text color='gray.400'>
            {currentPromo?.paxInclusion
              ? `${currentPromo.promoName ?? 'N/A'} is inclusive of ${currentPromo.paxInclusion} pax only`
              : 'PACKAGE IS INCLUSIVE OF ' + getMainMin() + ' pax'}
            .
          </Text>
          <Text color='gray.400'>CHILDREN 2 YEARS BELOW ARE FREE Do not add in # of pax</Text>
          <Text color='gray.400'>
            You'll only be able to add additional guests if you enter {guestSetting.minOverNightGuestPax} pax
          </Text>
        </Box>
      </VStack>

      {!!scheduleEndNextDay && !!isAllRooms && (
        <VStack alignItems='left' spacing={2}>
          <Text fontSize='lg' fontWeight='semibold'>
            Enter Additional Overnight guests:
          </Text>
          <Box h='100%' w='30%'>
            <NumberFieldV2
              disabled={isAdditionalInputsDisabled()}
              maxValue={extraHeadsTotalOvernight}
              value={`${overNightGuests}`}
              property='overNightGuests'
              onChange={(v) => {
                if (v === '') setOverNightGuests(0);
                else setOverNightGuests(parseInt(v, 10));
              }}
            />
          </Box>
          <Box w='70%' fontSize='12px' lineHeight={1.5}>
            <Text color='gray.400'>
              MAX OF {extraHeadsTotalOvernight} PAX ₱{guestSetting.overNightGuestFee}
              /HEAD
            </Text>
            <Text color='gray.400'>CHILDREN 2 YEARS BELOW ARE FREE Do not add in # of pax</Text>
          </Box>
          <Stack w='100%'>
            <Text color='red.500' textAlign='left'>
              {overNightGuests > extraHeadsTotalOvernight ? `Extra Heads Allowed are only ${extraHeadsTotalOvernight}!` : ''}
            </Text>
          </Stack>
        </VStack>
      )}

      <VStack alignItems='left' spacing={2}>
        <Text fontSize='lg' fontWeight='semibold'>
          {!!isAllRooms ? 'Enter Additional Non-Overnight guests:' : 'Enter Additional guests:'}
        </Text>
        <Box h='100%' w='30%'>
          <NumberFieldV2
            disabled={isAdditionalInputsDisabled()}
            maxValue={extraHeadsTotalNonOvernight}
            value={`${nonOverNightGuests}`}
            property='nonOverNightGuests'
            onChange={(v) => {
              if (v === '') setNonOverNightGuests(0);
              else setNonOverNightGuests(parseInt(v, 10));
            }}
          />
        </Box>
        <Box w='70%' fontSize='12px' lineHeight={1.5}>
          <Text color='gray.400'>
            MAX OF {extraHeadsTotalNonOvernight} PAX ₱{guestSetting.nonOverNightGuestFee}/HEAD
          </Text>
          <Text color='gray.400'>CHILDREN 2 YEARS BELOW ARE FREE Do not add in # of pax</Text>
        </Box>
        <Stack w='100%'>
          <Text color='red.500' textAlign='left'>
            {nonOverNightGuests > guestSetting.maxNonOverNightGuestPax &&
              `Extra Heads Allowed are only ${extraHeadsTotalNonOvernight}!`}
          </Text>
        </Stack>
      </VStack>

      {!selectedProduct.isAllRooms && (
        <ChooseRoom chosenSchedule={selectedProduct} chosenRoomsMap={chosenRoomsMap} setChosenRoomsMap={setChosenRoomsMap} />
      )}

      <Stack direction='row' justifyContent='flex-end'>
        <Box w='400px'>
          <CostView
            guests={{
              nonOverNightGuests: !!scheduleEndNextDay && !!isAllRooms ? nonOverNightGuests : nonOverNightGuests + guests,
              overNightGuests: !!scheduleEndNextDay && !!isAllRooms ? overNightGuests + guests : overNightGuests,
            }}
            product={selectedProduct}
            rooms={Array.from(chosenRoomsMap, (entry) => entry[1])}
            bookedDate={data.bookingDate || undefined}
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
