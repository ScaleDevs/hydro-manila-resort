import { Select, Box, Text } from '@chakra-ui/react';
import { UseFormRegister } from 'react-hook-form';
import { RegexValidations } from '@/modules/utils/helper';
import { GetApp } from '@/appspecs/theme';

export interface ISelectNumberFieldProps {
  register: UseFormRegister<any>;
  property: string;
  placeholder?: string;
  errMsg?: string;
  value?: number;
  minOpt?: number;
  maxOpt: number;
  label?: string;
  noZeroStart?: boolean;
}

export function SelectNumberField({
  register,
  property,
  value,
  placeholder,
  minOpt,
  maxOpt,
  errMsg,
  label,
  noZeroStart,
}: ISelectNumberFieldProps) {
  const setFormValue = (v: string) => {
    if (v === '') return undefined;
    if (v === '00') return 0;
    return !!RegexValidations.FloatOnly.exec(v) ? parseFloat(v) : v;
  };

  return (
    <Box w='100%'>
      <Text fontSize='md'>{label}</Text>
      <Select
        {...register(property, {
          setValueAs: setFormValue,
          value: value === undefined ? '' : value,
        })}
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
        {!noZeroStart && <option value='00'>00</option>}
        {Array(maxOpt)
          .fill(minOpt || 1)
          .map((v, i) => (
            <option key={i} value={v + i}>
              {v + i < 10 ? `0${v + i}` : v + i}
            </option>
          ))}
      </Select>
      {errMsg ? <Text color='red'>{errMsg}!</Text> : ''}
    </Box>
  );
}
