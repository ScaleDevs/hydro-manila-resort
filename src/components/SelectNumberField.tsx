import { Select, Box, Text } from '@chakra-ui/react';
import { UseFormRegister } from 'react-hook-form';
import { RegexValidations } from '@/utils/helper';

export interface ISelectNumberFieldProps {
  register: UseFormRegister<any>;
  property: string;
  placeholder?: string;
  errMsg?: string;
  value?: number;
  maxOpt: number;
}

export function SelectNumberField({ register, property, value, placeholder, maxOpt, errMsg }: ISelectNumberFieldProps) {
  const setFormValue = (v: string) => {
    if (v === '') return undefined;
    if (v === '00') return 0;
    return !!RegexValidations.FloatOnly.exec(v) ? parseFloat(v) : v;
  };

  return (
    <Box w='100%'>
      <Select
        {...register(property, {
          setValueAs: setFormValue,
          value: value === undefined ? '' : value,
        })}
      >
        <option value='' disabled selected>
          {placeholder}
        </option>
        <option value='00'>00</option>
        {Array(maxOpt)
          .fill(1)
          .map((v, i) => (
            <option key={i} value={v + i}>
              {v + i}
            </option>
          ))}
      </Select>
      {errMsg ? <Text color='red'>{errMsg}!</Text> : ''}
    </Box>
  );
}
