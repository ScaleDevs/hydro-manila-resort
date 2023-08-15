import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import dayjs from 'dayjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, SlideFade, Heading, Skeleton, Stack, Button, Alert, AlertIcon } from '@chakra-ui/react';

import { trpc } from '@/utils/trpc';
import { IProduct } from '@/utils/types';
import { SelectField } from '@/components/SelectField';
import { NumberFieldV2 } from '@/components/NumberFieldV2';
import { DateTimeField } from '@/components/DateTimeField';
import ControlledChooseRooms from './components/ControlledChooseRooms';

const schema = z.object({
  guests: z.object({
    overNightGuests: z.number(),
    nonOverNightGuests: z.number(),
  }),
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
  const { mutate: updateBookingMutate, isLoading: isUpdating, isSuccess, error } = trpc.booking.updateBooking.useMutation();
  const { mutate: checkAvailabilityMutate, isLoading: isCheckingScheduleLoading } =
    trpc.booking.checkBookingAvailability.useMutation();
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
      guests: bookingInfo?.guests,
      rooms: !!fetchingBookingInfo || !bookingInfo ? [] : bookingInfo.rooms,
    },
  });

  const handleSelectProduct = (value: any) => {
    if (productsData) setSelectedProduct(productsData.records.find((v) => v.productId === value));
  };

  const submitUpdate = async (data: FormSchemaType) => {
    if (!bookingInfo) return;

    const { guestSetting } = selectedProduct || bookingInfo.product;

    if (data.bookingDate && dayjs(data.bookingDate).unix() < dayjs().unix()) {
      setFormError('Schedule is done and not editable!');
      return;
    }
    if (guestSetting.maxNonOverNightGuestPax < data.guests.nonOverNightGuests) {
      setFormError(`Max Guests (Non-Overnight) allowed is ${guestSetting.maxNonOverNightGuestPax}!`);
      return;
    }
    if (guestSetting.maxOverNightGuestPax < data.guests.overNightGuests) {
      setFormError(`Max Guests (Overnight) allowed is ${guestSetting.maxOverNightGuestPax}!`);
      return;
    }

    setFormError(null);

    const updates = {} as any;
    Object.keys(dirtyFields).forEach((key) => {
      updates[key] = data[key as keyof typeof data];
    });

    if (Object.keys(updates).length === 0) {
      setFormError(`No changes were made on the booking details`);
      return;
    }

    if (!!updates.bookingDate || !!updates.productId) {
      const isSchedTaken = await new Promise((resolve) => {
        checkAvailabilityMutate(
          {
            bookingDate: updates.bookingDate || data.bookingDate,
            productId: updates.productId || data.productId,
          },
          {
            onSuccess(isSchedTaken) {
              resolve(isSchedTaken);
            },
          },
        );
      });

      if (!!isSchedTaken) setFormError('Schedule is taken! Kindly choose another schedule');
    }

    updateBookingMutate(
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

  if (fetchingBookingInfo || fetchingProducts || fetchingRooms)
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
          <form onSubmit={handleSubmit(submitUpdate)}>
            <Stack spacing={5}>
              <NumberFieldV2 control={control} property='guests.overNightGuests' label='Guests (Overnight)' />
              <NumberFieldV2 control={control} property='guests.nonOverNightGuests' label='Guests (Non-Overnight)' />

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

            <Button type='submit' isLoading={isUpdating || isCheckingScheduleLoading}>
              UPDATE BOOKING
            </Button>
          </form>
        </Box>
      </SlideFade>

      <br />
    </Box>
  );
}
