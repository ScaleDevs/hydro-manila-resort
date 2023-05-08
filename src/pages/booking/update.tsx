import { Dispatch, SetStateAction } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Stack, Button, Box, useSteps, chakra, Center, Heading, SlideFade } from '@chakra-ui/react';
import { BsPatchCheckFill } from 'react-icons/bs';

import Layout from '@/layouts/index';
import FormStepper from '@/components/FormStepper';
import FindBookingInfoForm from '@/modules/booking/BookingUpdateRequestForm/FindBookingInfoForm';
import UpdateBookingRequestForm from '@/modules/booking/BookingUpdateRequestForm/EditBookingDetails';
import CustomerBankInput from '@/modules/booking/BookingUpdateRequestForm/CustomerBankInputs';
import ReviewDetails from '@/modules/booking/BookingUpdateRequestForm/ReviewDetails';
import useBookingUpdateRequestStoreTrack from '@/store/bookingupdaterequest.store';

const CheckIcon = chakra(BsPatchCheckFill);

const steps = [
  { title: 'First', description: 'Find Booking Record' },
  { title: 'Second', description: 'Edit Booking Details' },
  { title: 'Third', description: 'Bank Details' },
  { title: 'Fourth', description: 'Review Details' },
];

interface IActiveFormProps {
  activeStep: number;
  setActiveStep: Dispatch<SetStateAction<number>>;
}

const ActiveForm = ({ activeStep, setActiveStep }: IActiveFormProps) => {
  const { bookingUpdateCase, resetStates } = useBookingUpdateRequestStoreTrack();

  if (activeStep === 1)
    return (
      <UpdateBookingRequestForm
        nextStep={() => {
          setActiveStep(2);
        }}
        previousStep={() => {
          setActiveStep(0);
          resetStates();
        }}
      />
    );

  if (activeStep === 2 && bookingUpdateCase === 'PARTIAL REFUND')
    return <CustomerBankInput nextStep={() => setActiveStep(3)} previousStep={() => setActiveStep(1)} />;

  if (activeStep === 2 && bookingUpdateCase === 'NORMAL')
    return <CustomerBankInput nextStep={() => setActiveStep(3)} previousStep={() => setActiveStep(1)} />;

  if (activeStep === 2 && bookingUpdateCase === 'ADDITIONAL PAYMENT')
    return <CustomerBankInput nextStep={() => setActiveStep(3)} previousStep={() => setActiveStep(1)} />;

  if (activeStep === 3) return <ReviewDetails previousStep={() => setActiveStep(2)} />;

  return (
    <FindBookingInfoForm
      nextStep={() => {
        setActiveStep(1);
      }}
    />
  );
};

export default function UpdateBooking() {
  const router = useRouter();
  const { resetStates, isRequestSuccess } = useBookingUpdateRequestStoreTrack();

  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: steps.length,
  });

  const backToBooking = () => {
    setActiveStep(0);
    router.push('/');
    resetStates();
    return;
  };

  return (
    <Layout>
      <Head>
        <title>Booking | Update</title>
        <meta name='description' content='form to cancel booking' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <br />

      <Box w={{ base: '90%', xl: '100%' }} mx='auto' borderRadius='sm'>
        <Stack direction='row' justifyContent='left'>
          <Button onClick={backToBooking}>BACK TO BOOKING</Button>
        </Stack>

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

            <FormStepper activeStep={activeStep} steps={steps} />

            <br />
            <br />

            <ActiveForm {...{ activeStep, setActiveStep }} />
          </>
        )}
      </Box>
    </Layout>
  );
}
