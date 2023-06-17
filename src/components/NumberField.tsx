import { Input, Box, Text } from '@chakra-ui/react';
import { UseFormRegister } from 'react-hook-form';
import { RegexValidations } from '@/modules/utils/helper';

export interface INumberFieldProps {
  register?: UseFormRegister<any>;
  property: string;
  placeholder?: string;
  errMsg?: string;
  defaultvalue?: number;
  onBlur?: () => void;
  label?: string;
  required?: boolean;
}

export function NumberField({
  register,
  property,
  placeholder,
  errMsg,
  defaultvalue,
  onBlur,
  label,
  required,
}: INumberFieldProps) {
  const setFormValue = (v: string) => {
    if (v === '') return undefined;
    return !!RegexValidations.FloatOnly.exec(v) ? parseFloat(v) : v;
  };

  const inputProps = register ? {
    ...register(property, {
      setValueAs: setFormValue,
      onBlur: () => {
        onBlur && onBlur();
      },
    })
  } : {};

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
        {...inputProps}
        defaultValue={defaultvalue}
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
