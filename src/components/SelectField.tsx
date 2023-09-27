import { Select, Box, Text } from '@chakra-ui/react';
import { UseFormRegister } from 'react-hook-form';
import { GetApp } from '@/appspecs/theme';

export interface ISelectFieldProps {
  register: UseFormRegister<any>;
  property: string;
  placeholder?: string;
  errMsg?: string;
  value?: string;
  options: { label: string | JSX.Element; value: any }[];
  children?: any;
  handleOnChange?: (value: any) => void;
  disabled?: boolean;
  label?: string;
  required?: boolean;
}

export function SelectField({
  register,
  property,
  value,
  placeholder,
  options,
  errMsg,
  children,
  handleOnChange,
  disabled,
  label,
  required,
}: ISelectFieldProps) {
  const onChange = (e: any) => {
    !!handleOnChange && handleOnChange(e.target.value);
  };

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
      <Select
        {...register(property, { value: value === undefined ? '' : value, onChange })}
        disabled={disabled}
        borderColor='blackAlpha.500'
        borderRadius='sm'
        _hover={{
          borderColor: GetApp.ActiveColor,
        }}
        focusBorderColor={GetApp.ActiveColor}
        className='scrollbar'
      >
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
      {children}
    </Box>
  );
}
