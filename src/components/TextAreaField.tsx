import { Textarea, Box, Text } from '@chakra-ui/react';
import { UseFormRegister } from 'react-hook-form';
import { GetApp } from '@/appspecs/theme';

export interface ITextAreaFieldProps {
  register: UseFormRegister<any>;
  property: string;
  placeholder?: string;
  errMsg?: string;
  onBlur?: () => void;
  label?: string;
  required?: boolean;
}

export function TextAreaField({ register, property, placeholder, errMsg, onBlur, label, required }: ITextAreaFieldProps) {
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
      <Textarea
        {...register(property, {
          onBlur: () => {
            onBlur && onBlur();
          },
        })}
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
