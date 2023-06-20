import {
  Box,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
} from '@chakra-ui/react';
import * as React from 'react';

export interface INumberFieldV2Props {
  onChange: (value: any) => void;
  value: string;
}

export function NumberFieldV2(props: INumberFieldV2Props) {
  return (
    <Box>
      <NumberInput {...props}>
        <NumberInputField borderColor='BlackAlpha.400' />
        <NumberInputStepper>
          <NumberIncrementStepper color='BlackAlpha.400' />
          <NumberDecrementStepper color='BlackAlpha.400' />
        </NumberInputStepper>
      </NumberInput>
    </Box>
  );
}
