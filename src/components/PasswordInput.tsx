import { useState } from 'react';
import { Input, Box, chakra } from '@chakra-ui/react';
import { UseFormRegister } from 'react-hook-form';
import { BsFillEyeSlashFill, BsFillEyeFill } from 'react-icons/bs';

const EyeCloseIcon = chakra(BsFillEyeSlashFill);
const EyeOpenIcon = chakra(BsFillEyeFill);

export interface IPasswordInputProps {
  formInput?: {
    register?: UseFormRegister<any>;
    property: any;
  };
  placeholder?: string;
  onChange?: (event: any) => void;
}

export function PasswordInput({ onChange, formInput, placeholder }: IPasswordInputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const toggleShowPassword = () => setShowPassword(!showPassword);

  const useFormRegisterField = formInput?.register
    ? formInput.register(formInput.property, {
        onChange,
      })
    : {};

  return (
    <Box position='relative'>
      <Input
        {...useFormRegisterField}
        placeholder={placeholder || 'PASSWORD'}
        type={showPassword ? 'text' : 'password'}
        borderColor='primary.1'
        borderRadius='sm'
        _hover={{
          borderColor: 'teal.400',
        }}
        focusBorderColor='teal.400'
      />
      {showPassword ? (
        <EyeCloseIcon
          pos='absolute'
          zIndex='10'
          right='3'
          top='1.5'
          h='30px'
          w='30px'
          cursor='pointer'
          onClick={() => toggleShowPassword()}
        />
      ) : (
        <EyeOpenIcon
          pos='absolute'
          zIndex='10'
          right='3'
          top='1.5'
          h='30px'
          w='30px'
          cursor='pointer'
          onClick={() => toggleShowPassword()}
        />
      )}
    </Box>
  );
}
