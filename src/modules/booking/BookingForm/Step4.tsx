import * as React from 'react';
import dayjs from 'dayjs';
import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Stack,
  StackDivider,
  Text,
  useDisclosure,
} from '@chakra-ui/react';

import { trpc } from '@/utils/trpc';
import { tzSchedToDayJsInsance, capsFirstLetter } from '@/utils/helper';
import { useBookingStore } from '@/store/booking.store';
import usePaymentStoreTrack from '@/store/payment.store';
import CostView from '../components/CostView';
import { TermsAndConditionModal } from './T&CModal';
import { ConfirmModal } from './ConfirmModal';
import useAuthStoreTrack from '@/store/auth.store';

const FieldValueReport = ({ fieldName, value }: { fieldName: string; value: string }) => {
  return (
    <Stack direction='row'>
      <Text pt='2' fontSize='sm' fontWeight='semibold'>
        {fieldName}:
      </Text>
      <Text pt='2' fontSize='sm'>
        {value}
      </Text>
    </Stack>
  );
};

export interface IStep4Props {
  onPrev: () => void;
  onNext: () => void;
  fromAdmin?: boolean;
}

export function Step4({ onPrev, onNext, fromAdmin }: IStep4Props) {
  const { username } = useAuthStoreTrack();
  const { data, selectedProduct, selectedRooms } = useBookingStore();
  const { setPaymentStates } = usePaymentStoreTrack();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    mutate,
    isError,
    error,
    isLoading: isInitiatingPaymentSession,
  } = trpc.payment.initiatePaymentSessionForBooking.useMutation();
  const {
    mutate: adminCreateBooking,
    isLoading: isInserting,
    isError: isErrorInserting,
    error: errorInserting,
  } = trpc.booking.adminCreateBooking.useMutation();

  const proceedToPayment = () => {
    console.log('data', data);

    const { firstName, lastName, ...rest } = data;

    const payload = {
      ...rest,
      name: capsFirstLetter(firstName) + ' ' + capsFirstLetter(lastName),
    };

    mutate(payload, {
      onSuccess(data) {
        const paymentIntentResource = data.paymentIntentResource;

        setPaymentStates({
          clientKey: paymentIntentResource.data.attributes.client_key,
          paymentIntentId: paymentIntentResource.data.id,
        });

        onNext();
      },
    });

    onClose();
  };

  const insertBooking = (paymentId: string | null) => {
    const { firstName, lastName, ...rest } = data;

    const payload = {
      ...rest,
      name: capsFirstLetter(firstName) + ' ' + capsFirstLetter(lastName),
      paymentId,
    };

    if (username)
      adminCreateBooking(
        {
          username,
          payload,
        },
        {
          onSuccess(data) {
            onNext();
          },
        },
      );
  };

  if (!selectedProduct) return null;

  const endDate = dayjs(data.bookingDate)
    .add(!!selectedProduct.scheduleEndNextDay ? 1 : 0, 'day')
    .format('YYYY-MM-DD');

  return (
    <Stack spacing={5}>
      {isError || isErrorInserting ? (
        <Alert status='error' borderRadius='sm' my='10px' fontFamily='primary' color='red.600'>
          <AlertIcon />
          {error?.message || errorInserting?.message}
        </Alert>
      ) : (
        ''
      )}

      <Card>
        <CardBody>
          <Stack divider={<StackDivider />} spacing='4'>
            <Box>
              <Heading size='md' textTransform='uppercase' fontWeight='medium'>
                Booking Details
              </Heading>
              <Stack spacing={-2}>
                <FieldValueReport
                  fieldName='Check In'
                  value={tzSchedToDayJsInsance(data.bookingDate, selectedProduct.scheduleStart).format('hh:mm A MMM DD, YYYY')}
                />
                <FieldValueReport
                  fieldName='Check Out'
                  value={tzSchedToDayJsInsance(endDate, selectedProduct.scheduleEnd).format('hh:mm A MMM DD, YYYY')}
                />
              </Stack>
              <Stack spacing={-2}>
                {!!data.guests.nonOverNightGuests && (
                  <FieldValueReport
                    fieldName={`Guests ${selectedProduct.isAllRooms ? '(Non-Overnight)' : ''}`}
                    value={`${data.guests.nonOverNightGuests}`}
                  />
                )}
                {!!data.guests.overNightGuests && (
                  <FieldValueReport fieldName='Guests (Overnight)' value={`${data.guests.overNightGuests}`} />
                )}
                {!selectedProduct.isAllRooms && (
                  <FieldValueReport
                    fieldName='Rooms'
                    value={`${Array.from(selectedRooms, (entry) => entry[1].roomIdentityName).join(', ')}`}
                  />
                )}
              </Stack>
            </Box>

            <Box>
              <Heading size='md' textTransform='uppercase' fontWeight='medium'>
                Personal Details
              </Heading>
              <Stack spacing={-2}>
                <FieldValueReport
                  fieldName='Name'
                  value={capsFirstLetter(data.firstName) + ' ' + capsFirstLetter(data.lastName)}
                />
                <FieldValueReport fieldName='Contact Number' value={data.phoneNumber} />
                <FieldValueReport fieldName='Email' value={data.email} />
              </Stack>
            </Box>
          </Stack>
        </CardBody>
      </Card>

      <TermsAndConditionModal isOpen={!fromAdmin && isOpen} onClose={onClose} onAccept={proceedToPayment} />
      <ConfirmModal isOpen={!!fromAdmin && isOpen} onClose={onClose} onAccept={insertBooking} isLoading={isInserting} />

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
        {fromAdmin ? (
          <Button onClick={onOpen}>PROCEED</Button>
        ) : (
          <Button onClick={onOpen} isLoading={isInitiatingPaymentSession}>
            PROCEED TO PAYMENT
          </Button>
        )}
      </Stack>
    </Stack>
  );
}
