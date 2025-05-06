import { Input, Box, Text } from '@chakra-ui/react';
import { Path, UseFormRegister } from 'react-hook-form';
import { GetApp } from '@/appspecs/theme';

export interface IDateTimeFieldProps<T extends Record<string, any>> {
  register: UseFormRegister<T>;
  property: Path<T>;
  errMsg?: string;
  onBlur?: () => void;
  label?: string;
  required?: boolean;
  type?: 'datetime-local' | 'date';
  defaultValue?: string;
}

export function DateTimeField<T extends Record<string, any>>({
  register,
  property,
  errMsg,
  onBlur,
  label,
  required,
  type = 'datetime-local',
  defaultValue,
}: IDateTimeFieldProps<T>) {
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
        {...register(property, {
          onBlur: () => {
            onBlur && onBlur();
          },
        })}
        type={type}
        borderColor='blackAlpha.500'
        borderRadius='sm'
        _hover={{
          borderColor: GetApp.ActiveColor,
        }}
        focusBorderColor={GetApp.ActiveColor}
        defaultValue={defaultValue}
      />
      {errMsg ? <Text color='red'>{errMsg}!</Text> : ''}
    </Box>
  );
}
