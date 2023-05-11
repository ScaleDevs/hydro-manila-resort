import * as React from 'react';

import { Stack, Step, StepIcon, StepIndicator, StepSeparator, StepStatus, Stepper, Text } from '@chakra-ui/react';
import useBookingUpdateRequestStoreTrack from '@/store/bookingupdaterequest.store';

export interface IFormStepperProps {
  activeStep: number;
}

export default function FormStepper({ activeStep }: IFormStepperProps) {
  const { stepDescription, stepsLength } = useBookingUpdateRequestStoreTrack();

  return (
    <Stack>
      <Stepper size='sm' index={activeStep} gap='5' colorScheme='teal'>
        {Array(stepsLength)
          .fill(1)
          .map((v, index) => (
            <Step key={v + index}>
              <StepIndicator>
                <StepStatus complete={<StepIcon />} />
              </StepIndicator>
              <StepSeparator />
            </Step>
          ))}
      </Stepper>
      <Text>
        Step {activeStep + 1}: <b>{stepDescription}</b>
      </Text>
    </Stack>
  );
}
