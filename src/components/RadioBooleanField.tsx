import { Box, Text, Radio, RadioGroup, Stack } from '@chakra-ui/react';
import { Control, Controller } from 'react-hook-form';

export interface IRadioBooleanFieldProps {
  control: Control<any, any>;
  property: string;
  errMsg?: string;
  onChange?: () => void;
}

export function RadioBooleanField({ control, onChange: onChangeInputValue, property, errMsg }: IRadioBooleanFieldProps) {
  return (
    <Controller
      control={control}
      name={property}
      render={({ field: { onChange, value } }) => {
        return (
          <Box w='100%'>
            <RadioGroup
              value={value === undefined ? undefined : !!value ? '1' : '0'}
              onClick={(v) => {
                !!onChangeInputValue && onChangeInputValue();
                onChange({ target: { value: (v.target as any).value === '1' } });
              }}
            >
              <Stack direction='row'>
                <Radio value='1' colorScheme='default'>
                  Yes
                </Radio>
                <Radio value='0' colorScheme='default'>
                  No
                </Radio>
              </Stack>
            </RadioGroup>
            {errMsg ? <Text color='red'>{errMsg}!</Text> : ''}
          </Box>
        );
      }}
    />
  );
}
