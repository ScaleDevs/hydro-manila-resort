import * as React from 'react';

import { Stack, Step, StepIcon, StepIndicator, StepNumber, StepSeparator, StepStatus, Stepper, Text } from '@chakra-ui/react';

export interface IFormStepperProps {
  activeStep: number;
  stepDescription: string;
  stepsLength: number;
}

export default function FormStepper({ activeStep, stepDescription, stepsLength }: IFormStepperProps) {
  return (
    <Stack>
      <Stepper size='sm' index={activeStep} gap='5' colorScheme='default'>
        {Array(stepsLength)
          .fill(1)
          .map((v, index) => (
            <Step key={v + index}>
              <StepIndicator>
                <StepStatus complete={<StepIcon />} active={<StepNumber />} incomplete={<StepNumber />} />
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
