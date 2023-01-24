import { Box, Text, Radio, RadioGroup, Stack } from '@chakra-ui/react';
import { UseFormSetValue } from 'react-hook-form';

export interface IRadioBooleanFieldProps {
  property: string;
  errMsg?: string;
  setValue: UseFormSetValue<any>;
}

export function RadioBooleanField({ setValue, property, errMsg }: IRadioBooleanFieldProps) {
  const setFormValue = (value: boolean) => {
    setValue(property, value, {
      shouldValidate: true,
    });
  };

  return (
    <Box w='100%'>
      <RadioGroup>
        <Stack direction='row'>
          <Radio value='1' colorScheme='teal' onClick={() => setFormValue(true)}>
            Yes
          </Radio>
          <Radio value='0' colorScheme='teal' onClick={() => setFormValue(false)}>
            No
          </Radio>
        </Stack>
      </RadioGroup>
      {errMsg ? <Text color='red'>{errMsg}!</Text> : ''}
    </Box>
  );
}
