import * as React from 'react';
import dayjs from 'dayjs';
import {
  Box,
  Button,
  Card,
  CardBody,
  Heading,
  Stack,
  StackDivider,
  Text,
  SlideFade,
  Center,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { trpc } from '@/utils/trpc';
import { PHpeso, tzSchedToDayJsInsance, utcDateToTzDayInstance } from '@/utils/helper';
import useBookingUpdateRequestStoreTrack from '@/store/update_booking.store';
import usePaymentStoreTrack from '@/store/payment.store';
import CostView from '../components/CostView';

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

export interface IReviewDetailsProps {
  nextStep?: (desc: string) => void;
  previousStep: () => void;
}

export default function ReviewDetails({ previousStep, nextStep }: IReviewDetailsProps) {
  const {
    customerBankInfo,
    bookingInfo,
    selectedProduct,
    selectedRooms,
    bookingUpdates,
    bookingReferenceNo,
    bookingUpdateCase,
    newTotal,
    setStateField,
  } = useBookingUpdateRequestStoreTrack();
  const { setPaymentStates } = usePaymentStoreTrack();

  const {
    mutate: sendUpdateRequest,
    isLoading: isSendingUpdateRequest,
    isError,
  } = trpc.booking.customerUpdateRequest.useMutation();
  const { mutate: inititatePaymentSession, isLoading: isInitiationPaymentSession } =
    trpc.payment.initiatePaymentSessionForUpdateBooking.useMutation();

  const proceed = () => {
    if (bookingUpdateCase === 'ADDITIONAL PAYMENT' && bookingUpdates) {
      inititatePaymentSession(
        {
          bookingRefNo: bookingReferenceNo,
          bookingUpdates,
        },
        {
          onSuccess(data) {
            const paymentIntentResource = data.paymentIntentResource;

            setPaymentStates({
              clientKey: paymentIntentResource.data.attributes.client_key,
              paymentIntentId: paymentIntentResource.data.id,
            });

            nextStep && nextStep('Payment Method');
          },
        },
      );
    } else if (bookingUpdates) {
      sendUpdateRequest(
        {
          bookingRefNo: bookingReferenceNo,
          bookingRequestUpdate: bookingUpdates,
          customerInfo: customerBankInfo,
        },
        {
          onSuccess() {
            setStateField('isRequestSuccess', true);
          },
        },
      );
    }
  };

  if (!bookingInfo || !bookingUpdates || !selectedProduct)
    return (
      <Box w='100%' mx='auto' p='25px'>
        <Heading textAlign='center'>REVIEW DETAILS</Heading>
        <SlideFade in>
          <Center w='50%' h='300px' mx='auto'>
            <Heading size='md' textTransform='uppercase'>
              N/A
            </Heading>
          </Center>
        </SlideFade>
      </Box>
    );

  return (
    <SlideFade in>
      {isError && (
        <>
          <Alert status='error' borderRadius='sm' color='red.600'>
            <AlertIcon />
            Something Went Wrong! Kindly Try Again
          </Alert>
          <br />
        </>
      )}
      <Card>
        <CardBody>
          <Stack divider={<StackDivider />} spacing='4'>
            <Box>
              <Heading size='md' textTransform='uppercase'>
                Current Booking Details
              </Heading>
              <Stack spacing={-2}>
                <FieldValueReport fieldName='Reference No' value={bookingReferenceNo} />
                {!!bookingInfo.guests.overNightGuests && (
                  <FieldValueReport fieldName='Guests (Overnight)' value={`${bookingInfo.guests.overNightGuests}`} />
                )}
                <FieldValueReport fieldName='Guests (Non-Overnight)' value={`${bookingInfo.guests.nonOverNightGuests}`} />
                <FieldValueReport
                  fieldName='Check-In Date'
                  value={utcDateToTzDayInstance(bookingInfo.startSession).format('MMM DD, YYYY hh:mm A')}
                />
                <FieldValueReport
                  fieldName='Check-Out Date'
                  value={utcDateToTzDayInstance(bookingInfo.endSession).format('MMM DD, YYYY hh:mm A')}
                />
                <FieldValueReport fieldName='Schedule' value={selectedProduct.name || ''} />
                {!selectedProduct?.isAllRooms && (
                  <FieldValueReport
                    fieldName='Room'
                    value={bookingInfo.roomsObject.map((room) => room.roomIdentityName).join(', ') || 'N/A'}
                  />
                )}
              </Stack>
            </Box>
            <Box>
              <Heading size='md' textTransform='uppercase'>
                Booking Changes
              </Heading>
              <Stack spacing={-2}>
                {!!bookingUpdates?.guests?.overNightGuests && (
                  <FieldValueReport fieldName='Guests (Overnight)' value={`${bookingUpdates.guests.overNightGuests}`} />
                )}
                {!!bookingUpdates?.guests?.overNightGuests && (
                  <FieldValueReport fieldName='Guests (Non-Overnight)' value={`${bookingUpdates.guests.nonOverNightGuests}`} />
                )}
                {bookingUpdates.bookingDate && (
                  <>
                    <FieldValueReport
                      fieldName='Check-In Date'
                      value={`${tzSchedToDayJsInsance(bookingUpdates.bookingDate, selectedProduct.scheduleStart).format(
                        'MMM DD, YYYY hh:mm A',
                      )}`}
                    />
                    <FieldValueReport
                      fieldName='Check-Out Date'
                      value={`${tzSchedToDayJsInsance(
                        dayjs(bookingUpdates.bookingDate)
                          .add(!!selectedProduct.scheduleEndNextDay ? 1 : 0, 'day')
                          .format('YYYY-MM-DD'),
                        selectedProduct.scheduleEnd,
                      ).format('MMM DD, YYYY hh:mm A')}`}
                    />
                  </>
                )}
                {!selectedProduct.isAllRooms && bookingUpdates.rooms && (
                  <FieldValueReport fieldName='Room' value={Array.from(selectedRooms, (v) => v[1].roomIdentityName).join(', ')} />
                )}
              </Stack>
            </Box>
            {customerBankInfo && (
              <Box>
                <Heading size='md' textTransform='uppercase'>
                  Bank Details
                </Heading>
                <Stack spacing={-2}>
                  <FieldValueReport fieldName='Bank Type' value={customerBankInfo.bankType} />
                  <FieldValueReport fieldName='Account Name' value={customerBankInfo.accountName} />
                  <FieldValueReport fieldName='Account No' value={customerBankInfo.accountNo} />
                </Stack>
              </Box>
            )}
            <Box>
              <Heading size='md' textTransform='uppercase'>
                {bookingUpdateCase === 'PARTIAL REFUND' && 'Total Refund Amount:'}
                {bookingUpdateCase === 'ADDITIONAL PAYMENT' && 'Additional Payment:'}
              </Heading>
              <Stack spacing={-2}>
                <FieldValueReport fieldName='Amount' value={PHpeso.format(Math.abs(newTotal - bookingInfo.currentTotal))} />
              </Stack>
            </Box>
          </Stack>
        </CardBody>
      </Card>

      <br />

      <CostView
        product={selectedProduct}
        rooms={Array.from(selectedRooms, (v) => v[1])}
        guests={bookingUpdates.guests || bookingInfo.guests}
        bookedDate={bookingUpdates.bookingDate || (bookingInfo.startSession as string).split('T')[0]}
      />

      <br />

      {bookingUpdateCase === 'PARTIAL REFUND' && (
        <Alert status='info' borderRadius='sm' color='blue.600'>
          <AlertIcon />
          Note: Since you will be refunded a partial amount of {PHpeso.format(Math.abs(newTotal - bookingInfo.currentTotal))} this
          will send a request to the support team for updating the booking details and refund. You will receive an email response
          from them if the update and refund is successful.
        </Alert>
      )}

      <br />

      <Stack direction='row' justifyContent='space-between'>
        <Button onClick={previousStep}>BACK</Button>

        <Button onClick={proceed} isLoading={isSendingUpdateRequest || isInitiationPaymentSession}>
          {bookingUpdateCase === 'PARTIAL REFUND' ? 'SUBMIT REQUEST' : 'PROCEED'}
        </Button>
      </Stack>

      <br />
      <br />
    </SlideFade>
  );
}
