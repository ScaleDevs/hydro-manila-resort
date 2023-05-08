import { useEffect, useState } from 'react';
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
  const { bookingReferenceNo, setBookingReferenceNo, setBookingInfo } = useBookingUpdateRequestStoreTrack();
  const [errorMessage, setErrorMessage] = useState('');

  const {
    data: bookingInfo,
    isFetching,
    error,
  } = trpc.booking.getBookingByRefNoPublic.useQuery(bookingReferenceNo, {
    enabled: !!bookingReferenceNo,
  });

  const { register, handleSubmit, setValue } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
  });

  const searchBookingInfo = (data: FormSchemaType) => {
    setBookingReferenceNo(data.refNo);
  };

  useEffect(() => {
    if (bookingInfo) {
      setBookingInfo(bookingInfo);
      nextStep();
    }

    if (error?.message) {
      setErrorMessage(error.message);
      setBookingReferenceNo('');
      setValue('refNo', '');
    }
  }, [bookingInfo, setBookingInfo, nextStep, error, setBookingReferenceNo, setValue]);

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
            <Button type='submit' isLoading={isFetching}>
              SEARCH
            </Button>
          </form>
        </Box>
      </SlideFade>
    </>
  );
}
