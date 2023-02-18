import Head from 'next/head';
import { Box } from '@chakra-ui/react';
import Layout from '@/layouts/admin';
import BookingSetting from '@/modules/booking/BookingSettingForm';

function BookingSettings() {
  return (
    <Layout>
      <Head>
        <title>Admin | Bookings Settings</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Box w='100%' mx='auto'>
        <BookingSetting />
      </Box>
    </Layout>
  );
}

export default BookingSettings;
