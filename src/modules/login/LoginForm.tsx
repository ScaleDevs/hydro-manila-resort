import { Heading, Stack, Button, SlideFade } from '@chakra-ui/react';

import useLogin from '@/hooks/useLogin.hook';
import { PasswordInput } from '@/components/PasswordInput';
import { ErrorAlert } from '@/components/ErrorAlert';
import { TextField } from '@/components/TextField';

function LoginForm() {
  const { errMessage, handleSubmit, signIn, isSignInLoading, register } = useLogin();

  return (
    <SlideFade in>
      <Heading as='h1' size='lg' noOfLines={1} textAlign='center'>
        WELCOME, ADMIN!
      </Heading>

      <form onSubmit={handleSubmit(signIn)}>
        <Stack spacing='5' mt='20px'>
          <TextField register={register} property='username' placeholder='USERNAME' />

          <PasswordInput formInput={{ register, property: 'password' }} />

          {!!errMessage ? <ErrorAlert message={errMessage} /> : ''}

          <Button type='submit' isLoading={isSignInLoading}>
            LOG IN
          </Button>
        </Stack>
      </form>
    </SlideFade>
  );
}

export default LoginForm;
