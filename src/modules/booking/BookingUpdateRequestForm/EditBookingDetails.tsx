import { useState } from 'react';
import { Heading, SlideFade, Alert, AlertIcon, Stack, Button, Box, Center, Spinner } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { trpc } from '@/utils/trpc';
import { IProduct } from '@/utils/types';
import { SelectField } from '@/components/SelectField';
import { DateTimeField } from '@/components/DateTimeField';
import { NumberField } from '@/components/NumberField';
import useBookingUpdateRequestStoreTrack, {
  bookingRequestUpdatesSchema,
  BookingRequestUpdates,
} from '@/store/bookingupdaterequest.store';
import CostView from '../CostView';

const schema = bookingRequestUpdatesSchema;

export interface IUpdateBookingRequestFormProps {
  nextStep: () => void;
  previousStep: () => void;
}

export default function UpdateBookingRequestForm({ previousStep, nextStep }: IUpdateBookingRequestFormProps) {
  const {
    setBookingUpdates,
    bookingUpdates: savedValues,
    bookingInfo,
    setBookingUpdateCase,
    setNewTotal,
  } = useBookingUpdateRequestStoreTrack();

  const [selectedProduct, setSelectedProduct] = useState<IProduct | undefined>(undefined);
  const [formError, setFormError] = useState<string | null>(null);

  const { data: bookingSetting } = trpc.bookingSetting.getBookingSetting.useQuery();
  const { data: productsData, isLoading: fetchingProducts } = trpc.product.getProducts.useQuery({
    page: 1,
    limit: 100,
  });
  const { data: roomsData, isLoading: fetchingRooms } = trpc.room.getRooms.useQuery({ page: 1, limit: 100 });
  const { mutate, isLoading: isCheckingScheduleLoading } = trpc.booking.checkBookingAvailability.useMutation();

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields },
    watch,
  } = useForm<BookingRequestUpdates>({
    resolver: zodResolver(schema),
    defaultValues: {
      guests: savedValues?.guests || bookingInfo?.guests,
      bookingDate: savedValues?.bookingDate || (bookingInfo?.startSession as string).split('T')[0],
      productId: savedValues?.productId || bookingInfo?.productId,
      roomId: savedValues?.roomId || bookingInfo?.roomId || undefined,
    },
  });

  const handleSelectProduct = (value: any) => {
    if (productsData) setSelectedProduct(productsData.records.find((v) => v.productId === value));
  };

  const getUpdatedTotal = (data: BookingRequestUpdates) => {
    if (!bookingSetting || !productsData || !roomsData) return 0;

    const { productId, roomId, guests } = data;

    const product = productsData?.records.find((row) => row.productId === productId);
    const room = roomsData.records.find((row) => row.roomId === roomId);

    let newTotal = 0;
    if (product) newTotal += product.details[0].price;
    if (room) newTotal += room.details[0].price;
    if (guests && guests > bookingSetting.minPax) newTotal += (guests - bookingSetting.minPax) * bookingSetting.extraHeadFee;

    setNewTotal(newTotal);
    return newTotal;
  };

  const proceed = (data: BookingRequestUpdates) => {
    if (!dirtyFields || !bookingInfo) return;

    const updates = {} as any;

    (Object.keys(data) as Array<keyof typeof data>).forEach((key) => {
      if (key === 'bookingDate') {
        if (data[key] !== (bookingInfo.startSession as string).split('T')[0]) {
          updates[key] = data[key];
        }
      } else if (data[key] !== bookingInfo[key]) {
        updates[key] = data[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      setFormError('No Details Changed! You must edit a detail to proceed');
      return;
    }

    console.log('data updates', updates);

    const setStates = () => {
      setBookingUpdates(updates);
      const newTotal = getUpdatedTotal(data);

      if (newTotal > bookingInfo.currentTotal) {
        nextStep();
        setBookingUpdateCase('ADDITIONAL PAYMENT');
      } else if (newTotal < bookingInfo.currentTotal) {
        nextStep();
        setBookingUpdateCase('PARTIAL REFUND');
      } else {
        nextStep();
        setBookingUpdateCase('NORMAL');
      }
    };

    setFormError(null);

    if (updates.bookingDate || updates.productId) {
      const bookingDate = updates.bookingDate || (bookingInfo?.startSession as string).split('T')[0];
      const productId = updates.productId || bookingInfo.productId;

      mutate(
        { bookingDate, productId },
        {
          onSuccess(isSchedTaken) {
            if (isSchedTaken) setFormError('Schedule is not available! Please Choose another one.');
            else setStates();
          },
        },
      );

      return;
    }

    setStates();

    return;
  };

  if (fetchingProducts || fetchingRooms)
    return (
      <Box w='100%' mx='auto' p='25px'>
        <Heading textAlign='center'>EDIT BOOKING</Heading>
        <SlideFade in>
          <Center w='50%' h='300px' mx='auto'>
            <Spinner size='xl' />
          </Center>
        </SlideFade>
      </Box>
    );

  return (
    <SlideFade in={true} offsetY='20px'>
      <Box w={{ base: '95%', md: '100%' }} mx='auto'>
        <Alert status='info' borderRadius='sm' color='blue.600'>
          <AlertIcon />
          Kindly input the changes you want to update on your booking details
        </Alert>

        <br />

        {!!formError && (
          <>
            <Alert status='error' borderRadius='sm' color='red.600'>
              <AlertIcon />
              {formError}
            </Alert>
            <br />
          </>
        )}

        <Stack>
          <form onSubmit={handleSubmit(proceed)}>
            <Stack spacing={5}>
              <Stack direction={{ base: 'column', xl: 'row' }}>
                <NumberField register={register} property='guests' placeholder='*PAX' label='Guests' required />

                <DateTimeField
                  type='date'
                  required
                  label='Booking Date:'
                  register={register}
                  property='bookingDate'
                  errMsg={errors?.bookingDate?.message}
                />
              </Stack>

              <Stack direction={{ base: 'column', xl: 'row' }}>
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

                <SelectField
                  disabled={selectedProduct?.details[0].withRooms}
                  register={register}
                  property='roomId'
                  placeholder='ROOM RENTAL(optional)'
                  label='Room'
                  options={roomsData?.records.map((v) => ({ label: `${v.roomIdentityName}`, value: v.roomId })) || []}
                  value={watch('roomId') || bookingInfo?.roomId === null ? undefined : bookingInfo?.roomId}
                  errMsg={!!errors.roomId?.message ? 'Required!' : undefined}
                  required
                />
              </Stack>
            </Stack>

            <br />
            <CostView productId={watch('productId')} roomId={watch('roomId')} guests={watch('guests')} />
            <br />

            <Stack direction={{ base: 'column', sm: 'row' }} justifyContent='space-between'>
              <Button onClick={previousStep}>BACK</Button>

              <Button type='submit' isLoading={isCheckingScheduleLoading}>
                PROCEED
              </Button>
            </Stack>
          </form>
        </Stack>
      </Box>
    </SlideFade>
  );
}
