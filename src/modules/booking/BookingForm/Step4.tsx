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
import { tzSchedToDayJsInsance } from '@/utils/helper';
import { useBookingStore } from '@/store/booking.store';
import usePaymentStoreTrack from '@/store/payment.store';
import CostView from '../CostView';
import { TermsAndConditionModal } from './T&CModal';

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
}

export function Step4({ onPrev, onNext }: IStep4Props) {
  const { data, selectedProduct, selectedRooms } = useBookingStore();
  const { setPaymentStates } = usePaymentStoreTrack();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    mutate,
    isError,
    error,
    isLoading: isInitiatingPaymentSession,
  } = trpc.payment.initiatePaymentSessionForBooking.useMutation();

  const proceedToPayment = () => {
    console.log('data', data);

    mutate(data, {
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

  if (!selectedProduct) return null;

  const endDate = dayjs(data.bookingDate)
    .add(!!selectedProduct.scheduleEndNextDay ? 1 : 0, 'day')
    .format('YYYY-MM-DD');

  return (
    <Stack spacing={5}>
      {isError ? (
        <Alert status='error' borderRadius='sm' my='10px' fontFamily='primary' color='red.600'>
          <AlertIcon />
          {error.message}
        </Alert>
      ) : (
        ''
      )}

      <Card>
        <CardBody>
          <Stack divider={<StackDivider />} spacing='4'>
            <Box>
              <Heading size='md' textTransform='uppercase' fontWeight='medium'>
                Date & Time
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
            </Box>

            <Box>
              <Heading size='md' textTransform='uppercase' fontWeight='medium'>
                Addons
              </Heading>
              <Stack spacing={-2}>
                <FieldValueReport fieldName='Guests' value={`${data.guests}`} />
                <FieldValueReport
                  fieldName='Rooms'
                  value={`${Array.from(selectedRooms, (entry) => entry[1].roomIdentityName).join(', ')}`}
                />
              </Stack>
            </Box>

            <Box>
              <Heading size='md' textTransform='uppercase' fontWeight='medium'>
                Personal Details
              </Heading>
              <Stack spacing={-2}>
                <FieldValueReport fieldName='Name' value={data.name} />
                <FieldValueReport fieldName='Contact Number' value={data.phoneNumber} />
                <FieldValueReport fieldName='Email' value={data.email} />
              </Stack>
            </Box>
          </Stack>
        </CardBody>
      </Card>

      <TermsAndConditionModal isOpen={isOpen} onClose={onClose} onAccept={proceedToPayment} />

      <Stack direction='row' justifyContent='flex-end'>
        <Box w='400px'>
          <CostView guests={data.guests} product={selectedProduct} rooms={Array.from(selectedRooms, (entry) => entry[1])} />
        </Box>
      </Stack>

      <Stack direction='row' justifyContent='space-between'>
        <Button onClick={onPrev}>Back</Button>
        <Button onClick={onOpen} isLoading={isInitiatingPaymentSession}>
          PROCEED TO PAYMENT
        </Button>
      </Stack>
    </Stack>
  );
}
