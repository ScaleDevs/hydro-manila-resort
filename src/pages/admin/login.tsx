import Head from 'next/head';
import { Box } from '@chakra-ui/react';

import Layout from '@/layouts/login';
import useAuthStoreTrack from '@/store/auth.store';
import LoginForm from '@/modules/login/LoginForm';
import ForceChangePassword from '@/modules/login/ForceChangePassword';

function Login() {
  const { forceChangePassword } = useAuthStoreTrack();

  return (
    <Layout>
      <Head>
        <title>Admin Login</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Box w='100%' mx='auto'>
        <Box w={{ base: '90%', md: '450px' }} mt='200px' mx='auto' p='20px'>
          {forceChangePassword ? <ForceChangePassword /> : <LoginForm />}
        </Box>
      </Box>
    </Layout>
  );
}

export default Login;
