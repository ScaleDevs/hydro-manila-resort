import { useState } from 'react';
import { Alert, AlertIcon, Box, Button, Card, Heading, UnorderedList, ListItem, SlideFade } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { trpc } from '@/utils/trpc';
import useUpdateBookingStoreTrack from '@/store/update_booking.store';
import { TextField } from '@/components/TextField';

const schema = z.object({
  refNo: z.string().min(1, 'Required'),
});

type FormSchemaType = z.infer<typeof schema>;

export interface IFindBookingInfoFormProps {
  nextStep: () => void;
}

export default function FindBookingInfoForm({ nextStep }: IFindBookingInfoFormProps) {
  const { setBookingReferenceNo, setBookingInfo, setStateField } = useUpdateBookingStoreTrack();
  const [errorMessage, setErrorMessage] = useState('');

  const { mutate, isLoading } = trpc.booking.getBookingByRefNoPublic.useMutation();

  const { register, handleSubmit, setValue } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

  const searchBookingInfo = (payload: FormSchemaType) => {
    mutate(payload.refNo, {
      onSuccess(data) {
        const { scheduleEndNextDay, isAllRooms, guestSetting } = data.product;

        setBookingReferenceNo(payload.refNo);
        setBookingInfo(data);

        setStateField('selectedProduct', data.product);
        setStateField('selectedRooms', new Map(Array.from(data.roomsObject, (v) => [v.roomId, v])));
        setStateField(
          'currentFreeGuests',
          (() => {
            const guests = !!scheduleEndNextDay && !!isAllRooms ? data.guests.overNightGuests : data.guests.nonOverNightGuests;
            const minGuestsAllowed =
              !!scheduleEndNextDay && !!isAllRooms ? guestSetting.minOverNightGuestPax : guestSetting.minNonOverNightGuestPax;

            return guests > minGuestsAllowed ? minGuestsAllowed : guests;
          })(),
        );
        nextStep();
      },
      onError(error) {
        setErrorMessage(error.message);
        setBookingReferenceNo('');
        setValue('refNo', '');
      },
    });
  };

  return (
    <>
      <Card p={5} bg='blue.100' color='blue.600'>
        <Heading size='lg' color='blue.700'>
          Policy
        </Heading>
        <br />
        <UnorderedList>
          <ListItem>You are only allowed to update the Date, Guests, & Rooms</ListItem>
          <ListItem>You are not allowed to reschedule 3 days before your booking date</ListItem>
        </UnorderedList>
      </Card>

      <br />

      {!!errorMessage && (
        <>
          <Alert status='error' borderRadius='sm' color='red.600'>
            <AlertIcon />
            {errorMessage}
          </Alert>
          <br />
        </>
      )}

      <SlideFade in={true} offsetY='20px'>
        <Box borderRadius='sm' w={{ base: '100%', lg: '700px' }}>
          <form onSubmit={handleSubmit(searchBookingInfo)}>
            <TextField register={register} property='refNo' placeholder='Reference No.' label='Enter Booking Reference No.' />
            <br />
            <Button type='submit' isLoading={isLoading}>
              SEARCH
            </Button>
          </form>
        </Box>
      </SlideFade>
    </>
  );
}
