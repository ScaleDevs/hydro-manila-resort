import * as React from 'react';
import { Stack, Box, Button, Input, Text } from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import useBookingStoreTrack from '@/store/booking.store';
import { TextField } from '@/components/TextField';
import CostView from '../components/CostView';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  phoneNumber: z.string().min(1, 'Required'),
  email: z.string().email(),
  idImage: z.custom<File>((val) => val instanceof File && val.size > 0, {
    message: 'File is required and must not be empty',
  }),
});

type FormSchemaType = z.infer<typeof schema>;

export interface IStep3Props {
  onPrev: () => void;
  onNext: () => void;
}

export function Step3({ onPrev, onNext }: IStep3Props) {
  const { setBookingStateData, data, selectedProduct, selectedRooms } = useBookingStoreTrack();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phoneNumber,
      email: data.email,
    },
  });

  const proceed = (data: FormSchemaType) => {
    console.log('data', data);

    setBookingStateData({
      ...data,
    });
    onNext();
  };

  return (
    <form onSubmit={handleSubmit(proceed)}>
      <Stack spacing={5}>
        <Stack spacing='3' mt='20px'>
          <TextField
            register={register}
            property='firstName'
            placeholder='*First Name'
            label='First Name:'
            errMsg={errors.firstName?.message}
          />
          <TextField
            register={register}
            property='lastName'
            placeholder='*Last name'
            label='Last Name:'
            errMsg={errors.lastName?.message}
          />

          <TextField
            register={register}
            property='phoneNumber'
            placeholder='*Contact Number'
            label='Contact Number:'
            errMsg={errors.phoneNumber?.message}
          />
          <TextField register={register} property='email' placeholder='*Email' label='Email:' errMsg={errors.email?.message} />

          <Box>
            <Text fontSize='md'>
              ID upload
              <Text as='span' color='red' pl='1'>
                *
              </Text>
            </Text>

            <Controller
              name='idImage'
              control={control}
              render={({ field }) => (
                <Input
                  type='file'
                  accept='image/*'
                  borderColor='blackAlpha.500'
                  borderRadius='sm'
                  _hover={{ borderColor: 'teal.400' }}
                  focusBorderColor='teal.400'
                  py={1.5}
                  onChange={(e) => field.onChange(e.target.files?.[0])}
                />
              )}
            />
            {errors.idImage?.message ? <Text color='red'>{errors.idImage.message}!</Text> : ''}
          </Box>
        </Stack>

        <Stack direction='row' justifyContent='flex-end'>
          <Box w='400px'>
            <CostView
              guests={data.guests}
              product={selectedProduct}
              rooms={Array.from(selectedRooms, (entry) => entry[1])}
              bookedDate={data.bookingDate || undefined}
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
