import { Input, Box, Text } from '@chakra-ui/react';
import { UseFormRegister } from 'react-hook-form';

export interface ITextFieldProps {
  register: UseFormRegister<any>;
  property: string;
  placeholder?: string;
  errMsg?: string;
  onBlur?: () => void;
}

export function TextField({ register, property, placeholder, errMsg, onBlur }: ITextFieldProps) {
  return (
    <Box w='100%'>
      <Input
        {...register(property, {
          onBlur: () => {
            onBlur && onBlur();
          },
        })}
        placeholder={placeholder || ''}
        borderColor='primary.1'
        borderRadius='sm'
        _hover={{
          borderColor: 'teal.400',
        }}
        focusBorderColor='teal.400'
      />
      {errMsg ? <Text color='red'>{errMsg}!</Text> : ''}
    </Box>
  );
}
