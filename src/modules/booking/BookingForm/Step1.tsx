import { useState } from 'react';
import { Stack, Button, Box, Collapse } from '@chakra-ui/react';

import { ProductV2 } from '@/utils/types';
import useBookingStoreTrack from '@/store/booking.store';
import CostView from '../components/CostView';
import { ChooseDate } from '../components/ChooseDate';
import { ChooseSchedule } from '../components/ChooseTime';

interface Step1Props {
  onNext: () => void;
}

export function Step1({ onNext }: Step1Props) {
  const { setBookingStateData, setBookingState, data, selectedProduct, selectedRooms } = useBookingStoreTrack();
  const [chosenDate, setChosenDate] = useState<string | undefined>(data.bookingDate || undefined);
  const [chosenSchedule, setChosenSchedule] = useState<ProductV2 | undefined>(selectedProduct);

  const isDisabled = () => !chosenDate || !chosenSchedule;

  const proceed = () => {
    if (!chosenDate || !chosenSchedule) return;

    if (chosenSchedule.productId !== selectedProduct?.productId) {
      setBookingStateData({
        guests: {
          overNightGuests: 0,
          nonOverNightGuests: 0,
        },
        roomIds: [],
      });

      setBookingState('selectedRooms', new Map());
      setBookingState('freeGuests', 0);
    }

    setBookingStateData({
      bookingDate: chosenDate,
      productId: chosenSchedule.productId,
    });

    setBookingState('selectedProduct', chosenSchedule);

    onNext();
  };

  return (
    <Stack direction='column' spacing={5}>
      <ChooseDate chosenDate={chosenDate} setChosenDate={setChosenDate} setChosenSchedule={setChosenSchedule} />
      {chosenDate && (
        <Collapse in={!!chosenDate} animateOpacity>
          <ChooseSchedule chosenDate={chosenDate} chosenSchedule={chosenSchedule} setChosenSchedule={setChosenSchedule} />
        </Collapse>
      )}
      <Stack direction='row' justifyContent='flex-end'>
        <Box w='400px'>
          <CostView
            guests={chosenSchedule?.productId !== selectedProduct?.productId ? undefined : data.guests}
            product={chosenSchedule || selectedProduct}
            rooms={Array.from(selectedRooms, (entry) => entry[1])}
            bookedDate={chosenDate || undefined}
          />
        </Box>
      </Stack>
      <Stack direction='row' justifyContent='flex-end'>
        <Button onClick={proceed} cursor={isDisabled() ? 'not-allowed' : 'pointer'}>
          Proceed
        </Button>
      </Stack>
    </Stack>
  );
}
