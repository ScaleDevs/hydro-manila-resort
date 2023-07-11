import { useState } from 'react';
import { Stack, Button, Box, Collapse } from '@chakra-ui/react';

import { ProductV2 } from '@/utils/types';
import useBookingStoreTrack from '@/store/booking.store';
import CostView from '../CostView';
import { ChooseDate } from './ChooseDate';
import { ChooseSchedule } from './ChooseTime';

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
            product={chosenSchedule || selectedProduct}
            rooms={Array.from(selectedRooms, (entry) => entry[1])}
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
