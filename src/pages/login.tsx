import Head from 'next/head';
import { Heading, Box, Input, Stack, Button } from '@chakra-ui/react';
import Layout from '@/layouts/login';

function Login() {
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

          <Stack spacing='5' mt='20px'>
            <Input placeholder='USERNAME' />

            <Input placeholder='PASSWORD' />
            <Button>LOG IN</Button>
          </Stack>
        </Box>
      </Box>
    </Layout>
  );
}

export default Login;
