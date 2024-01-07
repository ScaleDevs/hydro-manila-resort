import { Select, Box, Text } from '@chakra-ui/react';
import { UseFormRegister } from 'react-hook-form';

export interface ISelectBooleanFieldProps {
  register: UseFormRegister<any>;
  property: string;
  placeholder?: string;
  errMsg?: string;
}

export function SelectBooleanField({ register, property, placeholder, errMsg }: ISelectBooleanFieldProps) {
  return (
    <Box w='100%'>
      <Select
        {...register(property, {
          setValueAs: (v: string) => {
            if (v === '1') return true;
            if (v === '0') return false;
            return undefined;
          },
        })}
      >
        <option value='' disabled selected>
          {placeholder}
        </option>
        <option value='1'>Yes</option>
        <option value='0'>No</option>
      </Select>
      {errMsg ? <Text color='red'>{errMsg}!</Text> : ''}
    </Box>
  );
}
