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
        <Heading as='h1' size='lg' noOfLines={1} textAlign='center'>
          PRODUCTS PAGE
        </Heading>
      </Box>
    </Layout>
  );
}

export default Admin;
