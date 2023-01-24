import { Input, Box, Text } from '@chakra-ui/react';
import { UseFormRegister } from 'react-hook-form';

export interface ITextFieldProps {
  register: UseFormRegister<any>;
  property: string;
  placeholder?: string;
  errMsg?: string;
}

export function TextField({ register, property, placeholder, errMsg }: ITextFieldProps) {
  return (
    <Box w='100%'>
      <Input {...register(property)} placeholder={placeholder || ''} />
      {errMsg ? <Text color='red'>{errMsg}!</Text> : ''}
    </Box>
  );
}
