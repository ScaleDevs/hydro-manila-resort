import { Dispatch, SetStateAction, useEffect } from 'react';
import Head from 'next/head';
import { Stack, Box, useSteps, chakra, Center, Heading, SlideFade } from '@chakra-ui/react';
import { BsPatchCheckFill } from 'react-icons/bs';

import { GetApp } from '@/appspecs/theme';
import Layout from '@/layouts/index';
import FormStepper from '@/components/FormStepper';
import FindBookingInfoForm from '@/modules/booking/BookingUpdateForm/FindBookingInfoForm';
import CustomerBankInput from '@/modules/booking/BookingUpdateForm/CustomerBankInputs';
import ReviewDetails from '@/modules/booking/BookingUpdateForm/ReviewDetails';
import useUpdateBookingStoreTrack from '@/store/update_booking.store';
import PaymentForm from '@/modules/payment/PaymentForm';
import UpdateBookingRequestForm from '@/modules/booking/BookingUpdateForm/EditBookingDetails';

const CheckIcon = chakra(BsPatchCheckFill);

interface IActiveFormProps {
  activeStep: number;
  setActiveStep: Dispatch<SetStateAction<number>>;
}

const ActiveForm = ({ activeStep, setActiveStep }: IActiveFormProps) => {
  const { bookingUpdateCase, resetStates, setStateField } = useUpdateBookingStoreTrack();

  const previousStep = (step: number, desc: string) => {
    setActiveStep(step);
    setStateField('stepDescription', desc);
  };

  if (activeStep === 1)
    return (
      <UpdateBookingRequestForm
        onNext={() => {
          setActiveStep(2);
        }}
        onPrev={() => {
          previousStep(0, 'Find Booking Record');
          resetStates();
        }}
      />
    );

  if (activeStep === 2 && bookingUpdateCase === 'PARTIAL REFUND')
    return (
      <CustomerBankInput
        nextStep={() => {
          setStateField('stepDescription', 'Review Details');
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
          setStateField('stepDescription', desc);
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
        setStateField('stepDescription', 'Date & Time');
      }}
    />
  );
};

export default function UpdateBooking() {
  const { resetStates, isRequestSuccess, stepsLength, stepDescription } = useUpdateBookingStoreTrack();

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
        <link rel='icon' href={GetApp.Favicon} />
      </Head>

      <br />

      <Box w={{ base: '100%', sm: '90%', lg: '1000px' }} mx='auto'>
        {isRequestSuccess ? (
          <SlideFade in={true} offsetY='20px'>
            <Center p='100px' boxShadow='2xl' borderRadius='2xl' mt='50px'>
              <Stack direction='column' alignItems='center' spacing={50}>
                <Heading fontSize='3xl'>Your Request Has Been succesfully submitted</Heading>
                <CheckIcon h={200} w={200} color='green.500' />
              </Stack>
            </Center>
          </SlideFade>
        ) : (
          <Box w={{ base: '90%', md: '98%', lg: '95%' }} mx='auto'>
            <br />
            <br />

            <FormStepper activeStep={activeStep} stepDescription={stepDescription} stepsLength={stepsLength} />

            <br />
            <br />

            <ActiveForm {...{ activeStep, setActiveStep }} />
          </Box>
        )}
      </Box>
    </Layout>
  );
}
