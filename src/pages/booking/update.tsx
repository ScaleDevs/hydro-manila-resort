import { Dispatch, SetStateAction, useEffect } from 'react';
import Head from 'next/head';
import { Stack, Box, useSteps, chakra, Center, Heading, SlideFade } from '@chakra-ui/react';
import { BsPatchCheckFill } from 'react-icons/bs';

import Layout from '@/layouts/index';
import FormStepper from '@/components/FormStepper';
import FindBookingInfoForm from '@/modules/booking/BookingUpdateRequestForm/FindBookingInfoForm';
import UpdateBookingRequestForm from '@/modules/booking/BookingUpdateRequestForm/EditBookingDetails';
import CustomerBankInput from '@/modules/booking/BookingUpdateRequestForm/CustomerBankInputs';
import ReviewDetails from '@/modules/booking/BookingUpdateRequestForm/ReviewDetails';
import useBookingUpdateRequestStoreTrack from '@/store/bookingupdaterequest.store';
import PaymentForm from '@/modules/payment/PaymentForm';

const CheckIcon = chakra(BsPatchCheckFill);

interface IActiveFormProps {
  activeStep: number;
  setActiveStep: Dispatch<SetStateAction<number>>;
}

const ActiveForm = ({ activeStep, setActiveStep }: IActiveFormProps) => {
  const { bookingUpdateCase, resetStates, setStepDescription } = useBookingUpdateRequestStoreTrack();

  const previousStep = (step: number, desc: string) => {
    setActiveStep(step);
    setStepDescription(desc);
  };

  if (activeStep === 1)
    return (
      <UpdateBookingRequestForm
        nextStep={(desc: string) => {
          setActiveStep(2);
          setStepDescription(desc);
        }}
        previousStep={() => {
          previousStep(0, 'Find Booking Record');
          resetStates();
        }}
      />
    );

  if (activeStep === 2 && bookingUpdateCase === 'PARTIAL REFUND')
    return (
      <CustomerBankInput
        nextStep={() => {
          setStepDescription('Review Details');
          setActiveStep(3);
        }}
        previousStep={() => previousStep(1, 'Edit Booking Details')}
      />
    );

  if (activeStep === 2 && bookingUpdateCase === 'NORMAL')
    return <ReviewDetails previousStep={() => previousStep(1, 'Edit Booking Details')} />;

  if (activeStep === 2 && bookingUpdateCase === 'ADDITIONAL PAYMENT')
    return (
      <ReviewDetails
        previousStep={() => previousStep(1, 'Edit Booking Details')}
        nextStep={(desc) => {
          setStepDescription(desc);
          setActiveStep(3);
        }}
      />
    );

  if (activeStep === 3 && bookingUpdateCase === 'ADDITIONAL PAYMENT')
    return <PaymentForm previousStep={() => previousStep(2, 'Review Details')} />;
  else if (activeStep === 3) return <ReviewDetails previousStep={() => setActiveStep(2)} />;

  return (
    <FindBookingInfoForm
      nextStep={() => {
        setActiveStep(1);
        setStepDescription('Edit Booking Details');
      }}
    />
  );
};

export default function UpdateBooking() {
  const { resetStates, isRequestSuccess, stepsLength, stepDescription } = useBookingUpdateRequestStoreTrack();

  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: stepsLength,
  });

  const backToBooking = () => {
    setActiveStep(0);
    resetStates();
  };

  useEffect(() => {
    return () => {
      backToBooking();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Layout>
      <Head>
        <title>Booking | Update</title>
        <meta name='description' content='form to cancel booking' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <br />

      <Box w={{ base: '90%', xl: '100%' }} mx='auto' borderRadius='sm'>
        {isRequestSuccess ? (
          <SlideFade in={true} offsetY='20px'>
            <Center p='100px' boxShadow='2xl' borderRadius='2xl' mt='50px'>
              <Stack direction='column' alignItems='center' spacing={50}>
                <Heading>Your Request Has Been succesfully submitted</Heading>
                <CheckIcon h={200} w={200} color='green.500' />
              </Stack>
            </Center>
          </SlideFade>
        ) : (
          <>
            <br />
            <br />

            <FormStepper activeStep={activeStep} stepDescription={stepDescription} stepsLength={stepsLength} />

            <br />
            <br />

            <ActiveForm {...{ activeStep, setActiveStep }} />
          </>
        )}
      </Box>
    </Layout>
  );
}
