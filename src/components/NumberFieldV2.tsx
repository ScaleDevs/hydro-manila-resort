import * as React from 'react';
import {
  Box,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Text,
} from '@chakra-ui/react';
import { UseFormRegister } from 'react-hook-form';
import { RegexValidations } from '@/modules/utils/helper';
import { GetApp } from '@/appspecs/theme';

export interface INumberFieldV2Props {
  register?: UseFormRegister<any>;
  property: string;
  value?: string | number;
  placeholder?: string;
  label?: string;
  required?: boolean;
  errMsg?: string;
  onChange?: (value: any) => void;
  onBlur?: () => void;
}

export function NumberFieldV2(props: INumberFieldV2Props) {
  const { label, required, register, property, onBlur, onChange, value, errMsg } = props;

  const setFormValue = (v: string) => {
    if (v === '') return 0;
    if (v === '0') return parseFloat(v);
    return !!RegexValidations.FloatOnly.exec(v) ? parseFloat(v) : v;
  };

  const inputProps = register
    ? {
        ...register(property, {
          setValueAs: setFormValue,
          onBlur: () => {
            onBlur && onBlur();
          },
        }),
      }
    : { onChange, value };

  return (
    <Box w='100%'>
      <Text fontSize='md'>
        {label}
        {required && (
          <Text as='span' color='red' pl='1'>
            *
          </Text>
        )}
      </Text>
      <NumberInput value={value} onChange={onChange}>
        <NumberInputField
          {...inputProps}
          borderRadius='sm'
          transition='outline 0.1s linear'
          borderColor='blackAlpha.500'
          outline='0.5px solid transparent'
          _hover={{ borderColor: GetApp.ActiveColor }}
          _focusVisible={{
            borderColor: GetApp.ActiveColor,
            outline: '1.5px solid',
            outlineColor: GetApp.ActiveColor,
          }}
        />
        <NumberInputStepper>
          <NumberIncrementStepper color='BlackAlpha.400' />
          <NumberDecrementStepper color='BlackAlpha.400' />
        </NumberInputStepper>
      </NumberInput>

      {errMsg ? <Text color='red'>{errMsg}!</Text> : ''}
    </Box>
  );
}
