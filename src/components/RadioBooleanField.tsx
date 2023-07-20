import { Box, Text, Radio, RadioGroup, Stack } from '@chakra-ui/react';
import { UseFormSetValue } from 'react-hook-form';

export interface IRadioBooleanFieldProps {
  property: string;
  errMsg?: string;
  value?: boolean;
  setValue: UseFormSetValue<any>;
}

export function RadioBooleanField({ value, setValue, property, errMsg }: IRadioBooleanFieldProps) {
  const setFormValue = (value: boolean) => {
    setValue(property, value, {
      shouldValidate: true,
    });
  };

  return (
    <Box w='100%'>
      <RadioGroup value={value === undefined ? undefined : value === true ? '1' : '0'}>
        <Stack direction='row'>
          <Radio value='1' colorScheme='default' onClick={() => setFormValue(true)}>
            Yes
          </Radio>
          <Radio value='0' colorScheme='default' onClick={() => setFormValue(false)}>
            No
          </Radio>
        </Stack>
      </RadioGroup>
      {errMsg ? <Text color='red'>{errMsg}!</Text> : ''}
    </Box>
  );
}
