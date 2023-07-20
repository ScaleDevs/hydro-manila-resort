import * as React from 'react';
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
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { trpc } from '@/utils/trpc';
import { PHpeso } from '@/utils/helper';
import useBookingUpdateRequestStoreTrack from '@/store/bookingupdaterequest.store';
import usePaymentStoreTrack from '@/store/payment.store';
import CostView from '../CostView';

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
    enteredProduct,
    enteredRooms,
    bookingUpdates,
    bookingReferenceNo,
    bookingUpdateCase,
    newTotal,
    setIsRequestSuccess,
  } = useBookingUpdateRequestStoreTrack();
  const { setPaymentStates } = usePaymentStoreTrack();

  const { data: productsData, isLoading: fetchingProducts } = trpc.product.getProducts.useQuery({
    page: 1,
    limit: 100,
  });
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
            setIsRequestSuccess(true);
          },
        },
      );
    }
  };

  if (fetchingProducts)
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

  if (!bookingInfo || !bookingUpdates)
    return (
      <Box w='100%' mx='auto' p='25px'>
        <Heading textAlign='center'>EDIT BOOKING</Heading>
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
                <FieldValueReport fieldName='Booked Date' value={(bookingInfo.startSession as string).split('T')[0]} />
                <FieldValueReport
                  fieldName='Schedule'
                  value={productsData?.records.find((row) => row.productId === bookingInfo.productId)?.name || ''}
                />
                <FieldValueReport
                  fieldName='Room'
                  value={bookingInfo.roomsObject.map((room) => room.roomIdentityName).join(', ') || 'N/A'}
                />
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
                  <FieldValueReport fieldName='Booked Date' value={`${bookingUpdates.bookingDate}`} />
                )}
                {bookingUpdates.productId && (
                  <FieldValueReport
                    fieldName='Schedule'
                    value={productsData?.records.find((row) => row.productId === bookingUpdates.productId)?.name || 'N/A'}
                  />
                )}
                {bookingUpdates.rooms && (
                  <FieldValueReport fieldName='Room' value={enteredRooms.map((room) => room.roomIdentityName).join(', ') || ''} />
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
        product={enteredProduct}
        rooms={enteredRooms}
        guests={bookingUpdates.guests || bookingInfo.guests}
        bookedDate={bookingUpdates.bookingDate || (bookingInfo.startSession as string).split('T')[0]}
      />

      <br />

      {bookingUpdateCase === 'PARTIAL REFUND' && (
        <Alert status='info' borderRadius='sm' color='blue.600'>
          <AlertIcon />
          Note: Since you will be refunded a partial amount of {PHpeso.format(Math.abs(newTotal - bookingInfo.currentTotal))} this
          will send a request to the hydro team for updating the booking details and refund. You will receive an email response
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
