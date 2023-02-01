import { Input, Box, Text } from '@chakra-ui/react';
import { UseFormRegister } from 'react-hook-form';
import { RegexValidations } from '@/utils/helper';

export interface INumberFieldProps {
  register: UseFormRegister<any>;
  property: string;
  placeholder?: string;
  errMsg?: string;
}

export function NumberField({ register, property, placeholder, errMsg }: INumberFieldProps) {
  const setFormValue = (v: string) => {
    if (v === '') return undefined;
    return !!RegexValidations.FloatOnly.exec(v) ? parseFloat(v) : v;
  };

  return (
    <Box w='100%'>
      <Input
        {...register(property, {
          setValueAs: setFormValue,
        })}
        placeholder={placeholder}
        borderColor='primary.1'
        borderRadius='sm'
        _hover={{
          borderColor: 'teal',
        }}
        focusBorderColor='teal.400'
      />
      {errMsg ? <Text color='red'>{errMsg}!</Text> : ''}
    </Box>
  );
}
