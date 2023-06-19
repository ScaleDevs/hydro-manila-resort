import Head from 'next/head';
import { Box } from '@chakra-ui/react';
import Layout from '@/layouts/index';
import { BookingForm } from '@/modules/booking/BookingForm/BookingForm';

function Home() {
  return (
    <Layout>
      <Head>
        <title>Home</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <br />
      <Box w={{ base: '100%', sm: '90%', lg: '1000px' }} mx='auto'>
        <BookingForm />
        <br />
        <br />
        <br />
      </Box>
    </Layout>
  );
}

export default Home;
