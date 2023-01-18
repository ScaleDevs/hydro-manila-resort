import Head from 'next/head';
import { Heading, Box } from '@chakra-ui/react';
import Layout from '@/layouts/index';
import BookingForm from '@/modules/booking/BookingForm';

function Home() {
  return (
    <Layout>
      <Head>
        <title>Home</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <br />
      <Box w={{ base: '100%', sm: '90%', lg: '780px' }} mx='auto'>
        <Heading as='h1' size='lg' noOfLines={1} textAlign={{ base: 'center', md: 'left' }}>
          BOOK THE PLACE!
        </Heading>

        <BookingForm />

        <br />
        <br />
        <br />
        <br />
      </Box>
    </Layout>
  );
}

export default Home;
