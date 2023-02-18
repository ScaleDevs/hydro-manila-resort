import { Select, Box, Text } from '@chakra-ui/react';
import { UseFormRegister } from 'react-hook-form';
import { RegexValidations } from '@/modules/utils/helper';

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
      <Text fontSize='lg'>{label}</Text>
      <Select
        {...register(property, {
          setValueAs: setFormValue,
          value: value === undefined ? '' : value,
        })}
        borderColor='primary.1'
        borderRadius='sm'
        _hover={{
          borderColor: 'teal',
        }}
        focusBorderColor='teal.400'
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
