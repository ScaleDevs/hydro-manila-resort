import * as React from 'react';
import { Box, Center, Heading, SlideFade, Stack, chakra, useSteps } from '@chakra-ui/react';
import { BsPatchCheckFill } from 'react-icons/bs';
import { Step1 } from './Step1';
import { Step2 } from './Step2';
import { Step3 } from './Step3';
import { Step4 } from './Step4';
import FormStepper from '@/components/FormStepper';
import useBookingStoreTrack from '@/store/booking.store';
import PaymentForm from '@/modules/payment/PaymentForm';

const CheckIcon = chakra(BsPatchCheckFill);
interface IProp {
  fromAdmin?: boolean;
}

export function BookingForm({ fromAdmin }: IProp) {
  const { stepsLength, stepDescription, setBookingState } = useBookingStoreTrack();

  const { activeStep, setActiveStep } = useSteps({
    index: 0,
    count: stepsLength,
  });

  return (
    <Box w={{ base: '90%', md: '98%', lg: '95%' }} mx='auto'>
      <FormStepper activeStep={activeStep} stepDescription={stepDescription} stepsLength={stepsLength} />

      <br />
      {activeStep === 0 && (
        <SlideFade in={true} offsetY='20px'>
          <Step1
            onNext={() => {
              setActiveStep(1);
              setBookingState('stepDescription', 'Addons');
            }}
          />
        </SlideFade>
      )}
      {activeStep === 1 && (
        <SlideFade in={true} offsetY='20px'>
          <Step2
            onPrev={() => {
              setActiveStep(0);
              setBookingState('stepDescription', 'Date & Time');
            }}
            onNext={() => {
              setActiveStep(2);
              setBookingState('stepDescription', 'Personal Details');
            }}
          />
        </SlideFade>
      )}
      {activeStep === 2 && (
        <SlideFade in={true} offsetY='20px'>
          <Step3
            onPrev={() => {
              setActiveStep(1);
              setBookingState('stepDescription', 'Addons');
            }}
            onNext={() => {
              setActiveStep(3);
              setBookingState('stepDescription', 'Review Details');
            }}
          />
        </SlideFade>
      )}
      {activeStep === 3 && (
        <SlideFade in={true} offsetY='20px'>
          <Step4
            fromAdmin={fromAdmin}
            onPrev={() => {
              setActiveStep(2);
              setBookingState('stepDescription', 'Personal Details');
            }}
            onNext={() => {
              setActiveStep(4);
              if (fromAdmin) setBookingState('stepDescription', 'Success');
              else setBookingState('stepDescription', 'Payment');
            }}
          />
        </SlideFade>
      )}

      {activeStep === 4 && !fromAdmin ? (
        <SlideFade in={true} offsetY='20px'>
          <PaymentForm
            previousStep={() => {
              setActiveStep(3);
              setBookingState('stepDescription', 'Review Details');
            }}
          />
        </SlideFade>
      ) : (
        ''
      )}

      {activeStep === 4 && !!fromAdmin ? (
        <SlideFade in={true} offsetY='20px'>
          <Center p='100px' boxShadow='2xl' borderRadius='2xl' mt='50px'>
            <Stack direction='column' alignItems='center' spacing={50}>
              <Heading fontSize='3xl'>Successfuly created booking!</Heading>
              <CheckIcon h={200} w={200} color='green.500' />
            </Stack>
          </Center>
        </SlideFade>
      ) : (
        ''
      )}
    </Box>
  );
}
