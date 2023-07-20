import { useState } from 'react';
import { Alert, AlertIcon, Box, Button, SlideFade } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { trpc } from '@/utils/trpc';
import { TextField } from '@/components/TextField';
import useBookingUpdateRequestStoreTrack from '@/store/bookingupdaterequest.store';

const schema = z.object({
  refNo: z.string().min(1, 'Required'),
});

type FormSchemaType = z.infer<typeof schema>;

export interface IFindBookingInfoFormProps {
  nextStep: () => void;
}

export default function FindBookingInfoForm({ nextStep }: IFindBookingInfoFormProps) {
  const { setBookingReferenceNo, setBookingInfo, setEnteredProduct, setEnteredRooms } = useBookingUpdateRequestStoreTrack();
  const [errorMessage, setErrorMessage] = useState('');

  const { mutate, isLoading } = trpc.booking.getBookingByRefNoPublic.useMutation();

  const { register, handleSubmit, setValue } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

  const searchBookingInfo = (payload: FormSchemaType) => {
    mutate(payload.refNo, {
      onSuccess(data) {
        setBookingReferenceNo(payload.refNo);
        setBookingInfo(data);
        setEnteredProduct(data.product);
        setEnteredRooms(data.roomsObject);
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
