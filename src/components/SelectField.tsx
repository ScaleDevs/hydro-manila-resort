import { Select, Box, Text } from '@chakra-ui/react';
import { UseFormRegister } from 'react-hook-form';

export interface ISelectFieldProps {
  register: UseFormRegister<any>;
  property: string;
  placeholder?: string;
  errMsg?: string;
  value?: string;
  options: { label: string; value: any }[];
}

export function SelectField({ register, property, value, placeholder, options, errMsg }: ISelectFieldProps) {
  return (
    <Box w='100%'>
      <Select {...register(property, { value: value === undefined ? '' : value })}>
        <option value='' disabled selected>
          {placeholder}
        </option>
        {options.map((v, i) => (
          <option key={i} value={v.value}>
            {v.label}
          </option>
        ))}
      </Select>
      {errMsg ? <Text color='red'>{errMsg}!</Text> : ''}
    </Box>
  );
}
