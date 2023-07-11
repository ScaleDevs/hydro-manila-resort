import * as React from 'react';
import { Stack, Box, Button } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import useBookingStoreTrack from '@/store/booking.store';
import { TextField } from '@/components/TextField';
import CostView from '../CostView';

const schema = z.object({
  name: z.string().min(1, 'Required'),
  phoneNumber: z.string().min(1, 'Required'),
  email: z.string().email(),
});

type FormSchemaType = z.infer<typeof schema>;

export interface IStep3Props {
  onPrev: () => void;
  onNext: () => void;
}

export function Step3({ onPrev, onNext }: IStep3Props) {
  const { setBookingStateData, data } = useBookingStoreTrack();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data.name,
      phoneNumber: data.phoneNumber,
      email: data.email,
    },
  });

  const proceed = (data: FormSchemaType) => {
    setBookingStateData({
      ...data,
    });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(proceed)}>
      <Stack spacing={5}>
        <Stack spacing='3' mt='20px'>
          <TextField register={register} property='name' placeholder='*Name' label='Name:' errMsg={errors.name?.message} />
          <TextField
            register={register}
            property='phoneNumber'
            placeholder='*Contact Number'
            label='Contact Number:'
            errMsg={errors.phoneNumber?.message}
          />
          <TextField register={register} property='email' placeholder='*Email' label='Email:' errMsg={errors.email?.message} />
        </Stack>

        <Stack direction='row' justifyContent='flex-end'>
          <Box w='400px'>
            <CostView
              guests={data.guests}
              bookedDate={data.bookingDate || undefined}
              productId={data.productId}
              roomId={data.roomId}
            />
          </Box>
        </Stack>

        <Stack direction='row' justifyContent='space-between'>
          <Button onClick={onPrev}>Back</Button>
          <Button type='submit'>Proceed</Button>
        </Stack>
      </Stack>
    </form>
  );
}
