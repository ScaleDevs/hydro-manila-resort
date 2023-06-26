import Head from 'next/head';
import { Box } from '@chakra-ui/react';
import Layout from '@/layouts/admin';
import BookingSetting from '@/modules/booking/BookingSettingForm';
import { GetApp } from '@/appspecs/theme';

function BookingSettings() {
  return (
    <Layout>
      <Head>
        <title>Admin | Bookings Settings</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href={GetApp.Favicon} />
      </Head>

      <Box w='100%' mx='auto'>
        <BookingSetting />
      </Box>
    </Layout>
  );
}

export default BookingSettings;
