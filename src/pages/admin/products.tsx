import Head from 'next/head';
import { Heading, Box } from '@chakra-ui/react';
import Layout from '@/layouts/admin';

function Admin() {
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
            PRODUCTS PAGE
          </Heading>
        </Box>
      </Box>
    </Layout>
  );
}

export default Admin;
