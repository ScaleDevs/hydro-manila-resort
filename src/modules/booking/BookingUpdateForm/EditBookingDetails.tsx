import { useState } from 'react';
import {
  Heading,
  SlideFade,
  Alert,
  AlertIcon,
  Stack,
  Button,
  Box,
  Center,
  Spinner,
  Collapse,
  VStack,
  Text,
} from '@chakra-ui/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import dayjs from 'dayjs';

import { getExtraHeadsTotal, getProductPrice, utcDateToTzDayInstance } from '@/utils/helper';
import { trpc } from '@/utils/trpc';
import { IRoom } from '@/utils/types';
import useBookingUpdateRequestStoreTrack, {
  bookingRequestUpdatesSchema,
  BookingRequestUpdates,
} from '@/store/update_booking.store';
import { DateTimeField } from '@/components/DateTimeField';
import { NumberFieldV2 } from '@/components/NumberFieldV2';
import ControlledChooseRooms from '../components/ControlledChooseRooms';
import CostView from '../components/CostView';

const schema = bookingRequestUpdatesSchema;

export interface IUpdateBookingRequestFormProps {
  onNext: (desc: string) => void;
  onPrev: () => void;
}

export default function UpdateBookingRequestForm({ onPrev, onNext }: IUpdateBookingRequestFormProps) {
  const {
    currentFreeGuests,
    setBookingUpdates,
    bookingUpdates: savedValues,
    bookingInfo,
    setStateField,
    selectedRooms: chosenRooms,
    selectedProduct,
  } = useBookingUpdateRequestStoreTrack();

  const [selectedRooms, setSelectedRooms] = useState<IRoom[]>(Array.from(chosenRooms, (v) => v[1]));
  const [formError, setFormError] = useState<string | null>(null);
  const [freeGuests, setFreeGuests] = useState(currentFreeGuests);

  const { data: roomsData, isLoading: fetchingRooms } = trpc.room.getRooms.useQuery({ page: 1, limit: 100 });
  const { mutate, isLoading: isCheckingScheduleLoading } = trpc.booking.checkBookingAvailability.useMutation();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, dirtyFields },
    setValue,
    watch,
  } = useForm<BookingRequestUpdates>({
    resolver: zodResolver(schema),
    defaultValues: {
      guests: (() => {
        if (!selectedProduct || !bookingInfo) return undefined;

        const { scheduleEndNextDay, guestSetting, isAllRooms } = selectedProduct;
        const guests = savedValues?.guests || bookingInfo?.guests;

        if (!!scheduleEndNextDay && !!isAllRooms && freeGuests === guestSetting.minOverNightGuestPax)
          return {
            overNightGuests: guests.overNightGuests > freeGuests ? guests.overNightGuests - freeGuests : 0,
            nonOverNightGuests: guests.nonOverNightGuests,
          };

        if (freeGuests === guestSetting.minNonOverNightGuestPax)
          return {
            overNightGuests: guests.overNightGuests,
            nonOverNightGuests:
              guests.nonOverNightGuests > freeGuests ? guests.nonOverNightGuests - freeGuests : guests.nonOverNightGuests,
          };

        return {
          overNightGuests: 0,
          nonOverNightGuests: 0,
        };
      })(),
      bookingDate:
        savedValues?.bookingDate || (bookingInfo && utcDateToTzDayInstance(bookingInfo.startSession).format('YYYY-MM-DD')),
      rooms: savedValues?.rooms || bookingInfo?.rooms,
    },
  });

  const getUpdatedTotal = (data: BookingRequestUpdates) => {
    if (!selectedProduct || !roomsData) return 0;

    const { guestSetting } = selectedProduct;
    const { rooms, guests } = data;
    const roomsInstance = roomsData.records.filter((row) => rooms.includes(row.roomId));

    let newTotal = 0;
    if (selectedProduct) newTotal += getProductPrice(data.bookingDate, selectedProduct);

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

    setStateField('newTotal', newTotal);
    return newTotal;
  };

  const proceed = (data: BookingRequestUpdates) => {
    if (!dirtyFields || !bookingInfo || !selectedProduct) return;

    const { guestSetting, scheduleEndNextDay, isAllRooms } = selectedProduct;

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

    // reset booking updates state
    setStateField('bookingUpdates', undefined);

    const compareData = {
      ...data,
      guests: {
        overNightGuests:
          !!scheduleEndNextDay && !!isAllRooms ? freeGuests + data.guests.overNightGuests : data.guests.overNightGuests,
        nonOverNightGuests:
          !!scheduleEndNextDay && !!isAllRooms ? data.guests.nonOverNightGuests : freeGuests + data.guests.nonOverNightGuests,
      },
    };
    const updates = {} as any;

    if (compareData.bookingDate !== (bookingInfo.startSession as string).split('T')[0])
      updates['bookingDate'] = compareData.bookingDate;
    if (compareData.rooms.join(', ') !== bookingInfo.rooms.join(', ')) updates['rooms'] = compareData.rooms;
    if (
      compareData.guests.nonOverNightGuests !== bookingInfo.guests.nonOverNightGuests ||
      compareData.guests.overNightGuests !== bookingInfo.guests.overNightGuests
    )
      updates['guests'] = compareData.guests;

    if (Object.keys(updates).length === 0) {
      setFormError('No Details Changed! You must edit a detail to proceed');
      return;
    }

    if (!!formError) setFormError(null);

    setStateField('currentFreeGuests', freeGuests);

    const setStates = () => {
      setBookingUpdates(updates);
      const newTotal = getUpdatedTotal(compareData);

      if (newTotal > bookingInfo.currentTotal) {
        onNext('Review Details');
        setStateField('bookingUpdateCase', 'ADDITIONAL PAYMENT');
        setStateField('stepsLength', 2);
      } else if (newTotal < bookingInfo.currentTotal) {
        onNext('Customer Bank Info');
        setStateField('bookingUpdateCase', 'PARTIAL REFUND');
        setStateField('stepsLength', 3);
      } else {
        onNext('Review Details');
        setStateField('bookingUpdateCase', 'NORMAL');
        setStateField('stepsLength', 2);
      }

      setStateField('selectedRooms', new Map(Array.from(selectedRooms, (v) => [v.roomId, v])));
      setStateField('selectedProduct', selectedProduct);
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

  if (!selectedProduct) return null;

  const { guestSetting, scheduleEndNextDay, isAllRooms } = selectedProduct;

  const isAdditionalInputsDisabled = () =>
    freeGuests <
    (!!scheduleEndNextDay && !!isAllRooms ? guestSetting.minOverNightGuestPax : guestSetting.minNonOverNightGuestPax);
  const getMainMin = () =>
    !!scheduleEndNextDay && !!isAllRooms ? guestSetting.minOverNightGuestPax : guestSetting.minNonOverNightGuestPax;
  const extraHeadsTotalNonOvernight = guestSetting.maxNonOverNightGuestPax - guestSetting.minNonOverNightGuestPax;
  const extraHeadsTotalOvernight = guestSetting.maxOverNightGuestPax - guestSetting.minOverNightGuestPax;

  if (fetchingRooms)
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
            <Stack spacing={7}>
              <Stack direction={{ base: 'column', xl: 'row' }}>
                <DateTimeField
                  type='date'
                  required
                  label='Booking Date:'
                  register={register}
                  property='bookingDate'
                  errMsg={errors?.bookingDate?.message}
                />
              </Stack>

              <Stack direction={{ base: 'column' }} spacing={5}>
                <VStack alignItems='left' spacing={2}>
                  <NumberFieldV2
                    label='Guests'
                    maxValue={getMainMin()}
                    value={`${freeGuests}`}
                    property='freeGuests'
                    onChange={(v) => {
                      if (v === '') setFreeGuests(0);
                      else {
                        const value = parseInt(v, 10);
                        if (value < getMainMin()) setValue('guests', { nonOverNightGuests: 0, overNightGuests: 0 });
                        setFreeGuests(value);
                      }
                    }}
                  />
                  <Box w='70%' fontSize='12px' lineHeight={1.5}>
                    <Text color='gray.400'>PACKAGE IS INCLUSIVE OF {getMainMin()} pax.</Text>
                    <Text color='gray.400'>CHILDREN 2 YEARS BELOW ARE FREE Do not add in # of pax</Text>
                    <Text color='gray.400'>
                      You'll only be able to add additional guests if you enter {guestSetting.minOverNightGuestPax} pax
                    </Text>
                  </Box>
                </VStack>

                {!!scheduleEndNextDay && !!isAllRooms && (
                  <VStack alignItems='left' spacing={2}>
                    <NumberFieldV2
                      label='Additional Pax (Overnight)'
                      control={control}
                      property='guests.overNightGuests'
                      disabled={isAdditionalInputsDisabled()}
                    />
                    <Box w='70%' fontSize='12px' lineHeight={1.5}>
                      <Text color='gray.400'>
                        MAX OF {extraHeadsTotalOvernight} PAX ₱{guestSetting.overNightGuestFee}
                        /HEAD
                      </Text>
                      <Text color='gray.400'>CHILDREN 2 YEARS BELOW ARE FREE Do not add in # of pax</Text>
                    </Box>
                    <Stack w='100%'>
                      <Text color='red.500' textAlign='left'>
                        {watch('guests.overNightGuests') > extraHeadsTotalOvernight
                          ? `Extra Heads Allowed are only ${extraHeadsTotalOvernight}!`
                          : ''}
                      </Text>
                    </Stack>
                  </VStack>
                )}

                <VStack alignItems='left' spacing={2}>
                  <NumberFieldV2
                    label={!!isAllRooms ? 'Additional Pax (Non-Overnight)' : 'Additional Pax'}
                    control={control}
                    property='guests.nonOverNightGuests'
                    disabled={isAdditionalInputsDisabled()}
                  />
                  <Box w='70%' fontSize='12px' lineHeight={1.5}>
                    <Text color='gray.400'>
                      MAX OF {extraHeadsTotalNonOvernight} PAX ₱{guestSetting.nonOverNightGuestFee}/HEAD
                    </Text>
                    <Text color='gray.400'>CHILDREN 2 YEARS BELOW ARE FREE Do not add in # of pax</Text>
                  </Box>
                  <Stack w='100%'>
                    <Text color='red.500' textAlign='left'>
                      {watch('guests.nonOverNightGuests') > guestSetting.maxNonOverNightGuestPax &&
                        `Extra Heads Allowed are only ${extraHeadsTotalNonOvernight}!`}
                    </Text>
                  </Stack>
                </VStack>
              </Stack>

              <Collapse in={!selectedProduct?.isAllRooms} animateOpacity>
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
              </Collapse>
            </Stack>

            <br />

            <CostView
              rooms={selectedRooms}
              product={selectedProduct}
              guests={{
                nonOverNightGuests:
                  !!scheduleEndNextDay && !!isAllRooms
                    ? watch('guests.nonOverNightGuests')
                    : watch('guests.nonOverNightGuests') + freeGuests,
                overNightGuests:
                  !!scheduleEndNextDay && !!isAllRooms
                    ? watch('guests.overNightGuests') + freeGuests
                    : watch('guests.overNightGuests'),
              }}
              bookedDate={watch('bookingDate')}
            />

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
              <Button onClick={onPrev}>BACK</Button>

              <Button
                type='submit'
                isLoading={isCheckingScheduleLoading}
                isDisabled={
                  freeGuests >
                    (!!scheduleEndNextDay && !!isAllRooms
                      ? guestSetting.minOverNightGuestPax
                      : guestSetting.minNonOverNightGuestPax) ||
                  watch('guests.nonOverNightGuests') > extraHeadsTotalNonOvernight ||
                  watch('guests.overNightGuests') > extraHeadsTotalOvernight
                }
              >
                PROCEED
              </Button>
            </Stack>
          </form>
        </Stack>
      </Box>
    </SlideFade>
  );
}
