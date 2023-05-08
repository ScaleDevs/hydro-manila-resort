import * as React from 'react';

import { Stack, Step, StepIcon, StepIndicator, StepSeparator, StepStatus, Stepper, Text } from '@chakra-ui/react';

export interface IFormStepperProps {
  activeStep: number;
  steps: {
    title: string;
    description: string;
  }[];
}

export default function FormStepper({ activeStep, steps }: IFormStepperProps) {
  const activeStepText = steps[activeStep].description;

  return (
    <Stack>
      <Stepper size='sm' index={activeStep} gap='5'>
        {steps.map((step, index) => (
          <Step key={index}>
            <StepIndicator>
              <StepStatus complete={<StepIcon />} />
            </StepIndicator>
            <StepSeparator />
          </Step>
        ))}
      </Stepper>
      <Text>
        Step {activeStep + 1}: <b>{activeStepText}</b>
      </Text>
    </Stack>
  );
}
