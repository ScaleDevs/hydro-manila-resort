import { Input, Box, Text } from '@chakra-ui/react';
import { UseFormRegister } from 'react-hook-form';

export interface ITextFieldProps {
  register?: UseFormRegister<any>;
  property: string;
  placeholder?: string;
  errMsg?: string;
  onBlur?: () => void;
  label?: string;
  required?: boolean;
}

export function TextField({ register, property, placeholder, errMsg, onBlur, label, required }: ITextFieldProps) {
  const fieldProps = register
    ? {
        ...register(property, {
          onBlur: () => {
            onBlur && onBlur();
          },
        }),
      }
    : {};

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
      <Input
        {...fieldProps}
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
