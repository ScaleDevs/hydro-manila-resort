import Head from 'next/head';
import { Heading, Box, Stack, Button } from '@chakra-ui/react';

import Layout from '@/layouts/login';
import useLogin from '@/hooks/useLogin.hook';
import { PasswordInput } from '@/components/PasswordInput';
import { ErrorAlert } from '@/components/ErrorAlert';
import { TextField } from '@/components/TextField';

function Login() {
  const { errMessage, handleSubmit, signIn, isSignInLoading, register } = useLogin();

  return (
    <Layout>
      <Head>
        <title>Home</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Box w='100%' mx='auto'>
        <Box w={{ base: '90%', md: '450px' }} mt='200px' mx='auto' p='20px'>
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
        </Box>
      </Box>
    </Layout>
  );
}

export default Login;
