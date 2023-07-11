import { useState } from 'react';
import { Stack, Button, Box, Collapse } from '@chakra-ui/react';

import { IProduct } from '@/utils/types';
import useBookingStoreTrack from '@/store/booking.store';
import CostView from '../CostView';
import { ChooseDate } from './ChooseDate';
import { ChooseSchedule } from './ChooseTime';

interface Step1Props {
  onNext: () => void;
}

export function Step1({ onNext }: Step1Props) {
  const { setBookingStateData, setBookingState, data, selectedProduct } = useBookingStoreTrack();
  const [chosenDate, setChosenDate] = useState<string | null>(data.bookingDate || null);
  const [chosenSchedule, setChosenSchedule] = useState<IProduct | null>(selectedProduct);

  const isDisabled = () => !chosenDate || !chosenSchedule;

  const proceed = () => {
    if (!chosenDate || !chosenSchedule) return;

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
            guests={data.guests}
            bookedDate={chosenDate || undefined}
            productId={chosenSchedule?.productId || data.productId}
            roomId={data.roomId}
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
