import { useState } from 'react';
import { UseTRPCQueryResult } from '@trpc/react-query/shared';
import { inferRouterOutputs } from '@trpc/server';
import { AppRouter } from '@/server/routers/_app';
import { TRPCClientErrorLike } from '@trpc/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import dayjs from 'dayjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { Box, SlideFade, Heading, Skeleton, Stack, Button, Alert, AlertIcon, useToast } from '@chakra-ui/react';

import { trpc } from '@/utils/trpc';
import { IProduct } from '@/utils/types';
import useAuthStoreTrack from '@/store/auth.store';
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
  bookingInfo: UseTRPCQueryResult<
    inferRouterOutputs<AppRouter>['booking']['getBookingByRefNo'],
    TRPCClientErrorLike<AppRouter>
  >['data'];
  isIn?: boolean;
}

export default function AdminEditBookingForm({ bookingRefNo, bookingInfo, isIn }: IRescheduleFormProps) {
  const { username } = useAuthStoreTrack();
  const toast = useToast();
  const [selectedProduct, setSelectedProduct] = useState<IProduct | undefined>(bookingInfo?.product);
  const [formError, setFormError] = useState<string | null>(null);
  const { data: productsData, isLoading: fetchingProducts } = trpc.product.getProducts.useQuery({
    page: 1,
    limit: 100,
  });
  const { data: roomsData, isLoading: fetchingRooms } = trpc.room.getRooms.useQuery({ page: 1, limit: 100 });
  const {
    mutate: updateBookingMutate,
    isLoading: isUpdating,
    isSuccess,
    error,
    reset: resetMutation,
  } = trpc.booking.updateBooking.useMutation();
  const ctx = trpc.useContext();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, dirtyFields },
    setValue,
    watch,
    reset: resetFormFields,
  } = useForm<FormSchemaType>({
    resolver: zodResolver(schema),
    defaultValues: {
      guests: bookingInfo?.guests,
      rooms: bookingInfo?.rooms,
      productId: bookingInfo?.productId,
    },
  });

  const handleSelectProduct = (value: any) => {
    if (productsData) setSelectedProduct(productsData.records.find((v) => v.productId === value));
    setValue('rooms', [], {
      shouldDirty: true,
    });
  };

  const submitUpdate = async (data: FormSchemaType) => {
    if (!bookingInfo) return;

    if (!username) {
      toast({
        title: 'Invalid Admin User!',
        position: 'top-right',
        duration: 5000,
        isClosable: true,
        status: 'error',
      });

      return;
    }

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

    updateBookingMutate(
      {
        bookingId: bookingInfo.id,
        username,
        data: updates,
      },
      {
        onSuccess(data) {
          ctx.booking.getBookingByRefNo.setData(bookingRefNo, (currentData) => {
            return { ...currentData, ...data };
          });
          resetFormFields(updates);
          setTimeout(() => {
            resetMutation();
          }, 5000);
        },
      },
    );
  };

  if (fetchingProducts || fetchingRooms)
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
    <SlideFade in={isIn} offsetY='20px'>
      <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
        <Heading textAlign='center'>EDIT BOOKING</Heading>

        <br />

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
                value={watch('productId')}
                errMsg={!!errors.productId?.message ? 'Required!' : undefined}
                required
              />

              {roomsData?.records && !selectedProduct?.isAllRooms && (
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
                <Alert status='success' bg='green.500' borderRadius='sm' color='white'>
                  <AlertIcon color='green.200' />
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

            <Button type='submit' isLoading={isUpdating}>
              UPDATE BOOKING
            </Button>
          </form>
        </Box>

        <br />
      </Box>
    </SlideFade>
  );
}
