import { useState } from 'react';
import { Heading, SlideFade, Alert, AlertIcon, Stack, Button, Box, Center, Spinner } from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';

import { getExtraHeadsTotal } from '@/utils/helper';
import { trpc } from '@/utils/trpc';
import { IProduct, IRoom } from '@/utils/types';
import { SelectField } from '@/components/SelectField';
import { DateTimeField } from '@/components/DateTimeField';
import { NumberFieldV2 } from '@/components/NumberFieldV2';
import ControlledChooseRooms from '@/components/ControlledChooseRooms';
import useBookingUpdateRequestStoreTrack, {
  bookingRequestUpdatesSchema,
  BookingRequestUpdates,
} from '@/store/bookingupdaterequest.store';
import CostView from '../CostView';

const schema = bookingRequestUpdatesSchema;

export interface IUpdateBookingRequestFormProps {
  nextStep: (desc: string) => void;
  previousStep: () => void;
}

export default function UpdateBookingRequestForm({ previousStep, nextStep }: IUpdateBookingRequestFormProps) {
  const {
    setBookingUpdates,
    bookingUpdates: savedValues,
    bookingInfo,
    setBookingUpdateCase,
    setNewTotal,
    setBookingUpdateStates,
    enteredRooms,
    setEnteredRooms,
    enteredProduct,
    setEnteredProduct,
  } = useBookingUpdateRequestStoreTrack();

  const [selectedProduct, setSelectedProduct] = useState<IProduct | undefined>(enteredProduct);
  const [selectedRooms, setSelectedRooms] = useState<IRoom[]>(enteredRooms);
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
    control,
    watch,
  } = useForm<BookingRequestUpdates>({
    resolver: zodResolver(schema),
    defaultValues: {
      guests: savedValues?.guests || bookingInfo?.guests,
      bookingDate: savedValues?.bookingDate || (bookingInfo?.startSession as string).split('T')[0],
      productId: savedValues?.productId || bookingInfo?.productId,
      rooms: savedValues?.rooms || bookingInfo?.rooms,
    },
  });

  const handleSelectProduct = (value: any) => {
    if (productsData) setSelectedProduct(productsData.records.find((v) => v.productId === value));
  };

  const getUpdatedTotal = (data: BookingRequestUpdates) => {
    if (!bookingSetting || !productsData || !roomsData) return 0;

    const { guests: guestSetting } = bookingSetting;
    const { rooms, guests } = data;
    const roomsInstance = roomsData.records.filter((row) => rooms.includes(row.roomId));

    let newTotal = 0;
    if (selectedProduct) newTotal += selectedProduct.price;

    roomsInstance.forEach((recordInfo) => {
      if (selectedProduct?.includedRooms.some((roomId) => roomId === recordInfo.roomId)) return;
      newTotal += recordInfo.price;
    });

    newTotal += getExtraHeadsTotal(
      guests.nonOverNightGuests,
      guestSetting.minNonOverNightGuestPax,
      guestSetting.nonOverNightGuestFee,
    );

    newTotal += getExtraHeadsTotal(guests.overNightGuests, guestSetting.minOverNightGuestPax, guestSetting.overNightGuestFee);

    setNewTotal(newTotal);
    return newTotal;
  };

  const proceed = (data: BookingRequestUpdates) => {
    if (!dirtyFields || !bookingInfo || !bookingSetting) return;
    const { guests: guestSetting } = bookingSetting;

    if (data.bookingDate && dayjs(data.bookingDate).unix() < dayjs().unix()) {
      setFormError('Date is not available! Kindly choose another date');
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

    const updates = {} as any;

    (Object.keys(data) as Array<keyof typeof data>).forEach((key) => {
      if (key === 'bookingDate') {
        if (data[key] !== (bookingInfo.startSession as string).split('T')[0]) updates[key] = data[key];
      } else if (key === 'rooms') {
        if (data[key].join(', ') !== bookingInfo.rooms.join(', ')) updates[key] = data[key];
      } else if (data[key] !== bookingInfo[key]) {
        updates[key] = data[key];
      }
    });

    if (Object.keys(updates).length === 0) {
      setFormError('No Details Changed! You must edit a detail to proceed');
      return;
    }

    const setStates = () => {
      setBookingUpdates(updates);
      const newTotal = getUpdatedTotal(data);

      if (newTotal > bookingInfo.currentTotal) {
        nextStep('Review Details');
        setBookingUpdateCase('ADDITIONAL PAYMENT');
        setBookingUpdateStates({ stepsLength: 3 });
      } else if (newTotal < bookingInfo.currentTotal) {
        nextStep('Customer Bank Info');
        setBookingUpdateCase('PARTIAL REFUND');
        setBookingUpdateStates({ stepsLength: 4 });
      } else {
        nextStep('Review Details');
        setBookingUpdateCase('NORMAL');
        setBookingUpdateStates({ stepsLength: 3 });
      }

      setEnteredRooms(selectedRooms);
      setEnteredProduct(selectedProduct);
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
      <Box w={{ base: '95%', md: '100%' }} mx='auto' pb='40px'>
        <Alert status='info' borderRadius='sm' color='blue.600'>
          <AlertIcon />
          Kindly input the changes you want to update on your booking details
        </Alert>

        <br />

        <Stack>
          <form onSubmit={handleSubmit(proceed)}>
            <Stack spacing={5}>
              <Stack direction={{ base: 'column', xl: 'row' }}>
                <NumberFieldV2 label='Guests (Overnight)' register={register} property='guests.overNightGuests' />
                <NumberFieldV2 label='Guests (Non-Overnight)' register={register} property='guests.nonOverNightGuests' />
              </Stack>

              <Stack direction={{ base: 'column', xl: 'row' }}>
                <DateTimeField
                  type='date'
                  required
                  label='Booking Date:'
                  register={register}
                  property='bookingDate'
                  errMsg={errors?.bookingDate?.message}
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
              </Stack>

              <Stack direction='column'>
                {roomsData?.records && (
                  <ControlledChooseRooms
                    control={control}
                    isLoading={fetchingRooms}
                    records={roomsData.records}
                    selectedProduct={selectedProduct}
                    onAdd={(room) => setSelectedRooms((curr) => [...curr, room])}
                    onRemove={(roomId) => setSelectedRooms((curr) => [...curr].filter((room) => room.roomId !== roomId))}
                  />
                )}
              </Stack>
            </Stack>

            <br />
            <CostView rooms={selectedRooms} product={selectedProduct} guests={watch('guests')} />
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
