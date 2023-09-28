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
import { Control, Controller } from 'react-hook-form';
import { GetApp } from '@/appspecs/theme';

export interface INumberFieldV2Props {
  control?: Control<any, any>;
  property: string;
  value?: string | number;
  placeholder?: string;
  label?: string;
  required?: boolean;
  errMsg?: string;
  onChange?: (value: any) => void;
  onBlur?: () => void;
  maxValue?: number;
  disabled?: boolean;
}

export function NumberFieldV2(props: INumberFieldV2Props) {
  const { label, required, control, property, onBlur, onChange, value, errMsg, maxValue, disabled } = props;

  if (control)
    return (
      <Controller
        control={control}
        name={property}
        render={({ field: { onChange: setValue, value } }) => {
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
              <NumberInput
                value={value}
                onChange={(value) => {
                  setValue(value);
                  onChange && onChange(value);
                }}
                precision={2}
                max={maxValue}
                min={0}
              >
                <NumberInputField
                  onBlur={() => {
                    !!onBlur && onBlur();
                  }}
                  disabled={!!disabled}
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
        }}
      />
    );

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
      <NumberInput
        value={value}
        onChange={(_v, n) => {
          const takeValue = Number.isNaN(n) ? 0 : n;
          onChange && onChange(takeValue);
        }}
        max={maxValue}
        min={0}
      >
        <NumberInputField
          onBlur={() => {
            !!onBlur && onBlur();
          }}
          disabled={!!disabled}
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
