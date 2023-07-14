import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import dayjs from 'dayjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, SlideFade, Heading, Skeleton, Stack, Button, Alert, AlertIcon } from '@chakra-ui/react';

import { trpc } from '@/utils/trpc';
import { IProduct } from '@/utils/types';
import { SelectField } from '@/components/SelectField';
import { NumberField } from '@/components/NumberField';
import { DateTimeField } from '@/components/DateTimeField';
import ControlledChooseRooms from '@/components/ControlledChooseRooms';

const schema = z.object({
  guests: z.number(),
  productId: z.string().min(1, 'Required'),
  rooms: z.array(z.string().min(1)),
  bookingDate: z.string().min(1, 'Required'),
});

type FormSchemaType = z.infer<typeof schema>;

export interface IRescheduleFormProps {
  bookingRefNo: string;
}

export default function AdminEditBookingForm({ bookingRefNo }: IRescheduleFormProps) {
  const [selectedProduct, setSelectedProduct] = useState<IProduct | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);
  const { data: bookingInfo, isLoading: fetchingBookingInfo } = trpc.booking.getBookingByRefNo.useQuery(bookingRefNo);
  const { data: productsData, isLoading: fetchingProducts } = trpc.product.getProducts.useQuery({
    page: 1,
    limit: 100,
  });
  const { data: roomsData, isLoading: fetchingRooms } = trpc.room.getRooms.useQuery({ page: 1, limit: 100 });
  const { mutate, isLoading: isUpdating, isSuccess, error } = trpc.booking.updateBooking.useMutation();
  const { data: bookingSetting, isLoading: bookingSettingLoader } = trpc.bookingSetting.getBookingSetting.useQuery();
  const ctx = trpc.useContext();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, dirtyFields },
    watch,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      rooms: !!fetchingBookingInfo || !bookingInfo ? [] : bookingInfo.rooms,
    },
  });

  const handleSelectProduct = (value: any) => {
    if (productsData) setSelectedProduct(productsData.records.find((v) => v.productId === value));
  };

  const submitUpdate = (data: FormSchemaType) => {
    if (!bookingInfo || !bookingSetting) return;
    if (data.bookingDate && dayjs(data.bookingDate).unix() < dayjs().unix()) {
      setFormError('Schedule is not available! Kindly choose another date');
      return;
    }
    if (bookingSetting.maxPax < data.guests) {
      setFormError(`Max guests allowed is ${bookingSetting.maxPax}!`);
      return;
    }

    setFormError(null);

    const updates = {} as any;
    Object.keys(dirtyFields).forEach((key) => {
      updates[key] = data[key as keyof typeof data];
    });

    mutate(
      {
        bookingId: bookingInfo.id,
        data: updates,
      },
      {
        onSuccess(data) {
          ctx.booking.getBookingByRefNo.setData(bookingRefNo, (currentData) => {
            return { ...currentData, ...data };
          });
        },
      },
    );
  };

  if (fetchingBookingInfo || fetchingProducts || fetchingRooms || bookingSettingLoader)
    return (
      <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
        <Heading textAlign='center'>EDIT BOOKING</Heading>
        <br />
        <SlideFade in>
          <Stack w='50%' mx='auto' spacing={5}>
            <Skeleton height='20px' />
            <Skeleton height='20px' />
            <Skeleton height='20px' />
            <Skeleton height='20px' />
          </Stack>
        </SlideFade>
      </Box>
    );

  return (
    <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
      <Heading textAlign='center'>EDIT BOOKING</Heading>

      <br />

      <SlideFade in>
        <Box w={{ base: '95%', md: '90%' }} mx='auto'>
          {isSuccess && (
            <>
              <Alert status='success' borderRadius='sm' color='green.600'>
                <AlertIcon />
                Booking Successfuly updated!
              </Alert>
              <br />
            </>
          )}

          {(!!formError || error) && (
            <>
              <Alert status='error' borderRadius='sm' color='red.600'>
                <AlertIcon />
                {formError || error?.message || ''}
              </Alert>
              <br />
            </>
          )}

          <form onSubmit={handleSubmit(submitUpdate)}>
            <Stack spacing={5}>
              <NumberField
                register={register}
                property='guests'
                placeholder='*PAX'
                label='Guests'
                required
                defaultvalue={bookingInfo?.guests}
              />

              <DateTimeField
                type='date'
                required
                label='Booking Date:'
                register={register}
                property='bookingDate'
                errMsg={errors.bookingDate?.message}
                defaultValue={bookingInfo?.startSession.split('T')[0]}
              />

              <SelectField
                handleOnChange={handleSelectProduct}
                register={register}
                property='productId'
                placeholder='*Swimming Schedule'
                label='Schedule'
                options={
                  productsData?.records.map((v) => ({
                    label: v.name,
                    value: v.productId,
                  })) || []
                }
                value={watch('productId') || bookingInfo?.productId}
                errMsg={!!errors.productId?.message ? 'Required!' : undefined}
                required
              />

              {roomsData?.records && (
                <ControlledChooseRooms
                  control={control}
                  isLoading={fetchingRooms}
                  records={roomsData.records}
                  selectedProduct={selectedProduct}
                />
              )}
            </Stack>

            <br />

            <Button type='submit' isLoading={isUpdating}>
              UPDATE BOOKING
            </Button>
          </form>
        </Box>
      </SlideFade>

      <br />
    </Box>
  );
}
