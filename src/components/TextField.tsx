import { Input, Box, Text } from '@chakra-ui/react';
import { UseFormRegister } from 'react-hook-form';
import { GetApp } from '@/appspecs/theme';

export interface ITextFieldProps {
  register?: UseFormRegister<any>;
  property: string;
  placeholder?: string;
  errMsg?: string;
  onBlur?: () => void;
  label?: string;
  required?: boolean;
  onChange?: (value: string) => void;
}

export function TextField({ register, property, placeholder, errMsg, onBlur, label, required, onChange }: ITextFieldProps) {
  const fieldProps = register
    ? {
        ...register(property, {
          onBlur: () => {
            onBlur && onBlur();
          },
        }),
      }
    : { onChange: (e: any) => onChange && onChange(e.target.value) };

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
        borderColor='blackAlpha.500'
        borderRadius='sm'
        _hover={{
          borderColor: GetApp.ActiveColor,
        }}
        focusBorderColor={GetApp.ActiveColor}
      />
      {errMsg ? <Text color='red'>{errMsg}!</Text> : ''}
    </Box>
  );
}
