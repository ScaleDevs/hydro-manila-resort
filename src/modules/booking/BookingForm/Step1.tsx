import { useState } from 'react';
import { Stack, Button, Box, ScaleFade } from '@chakra-ui/react';

import { trpc } from '@/utils/trpc';
import { IRoom, ProductV2 } from '@/utils/types';
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
  const { data: roomsData, isLoading } = trpc.room.getRooms.useQuery({ page: 1, limit: 100 });

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

      const rooms = roomsData?.records;
      const roomsMapArray: [string, IRoom][] = [];

      if (!!rooms)
        chosenSchedule.includedRooms.forEach((p) => {
          const id = p;
          const value = rooms.find((r) => r.roomId === p);
          if (!!value) roomsMapArray.push([id, value]);
        });

      setBookingState('selectedRooms', new Map(roomsMapArray));
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
      <ScaleFade initialScale={0.9} in={!!chosenDate}>
        <ChooseSchedule
          chosenDate={chosenDate}
          chosenSchedule={chosenSchedule}
          setChosenSchedule={setChosenSchedule}
          isGettingRooms={isLoading}
        />
      </ScaleFade>
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
