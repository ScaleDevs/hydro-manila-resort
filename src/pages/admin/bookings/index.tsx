import Head from 'next/head';
import { Box } from '@chakra-ui/react';
import Layout from '@/layouts/admin';
import TableBookingRecords from '@/modules/booking/TableBookingRecords';
import { GetApp } from '@/appspecs/theme';

function Bookings() {
  return (
    <Layout>
      <Head>
        <title>Admin | Bookings</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href={GetApp.Favicon} />
      </Head>

      <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
        <TableBookingRecords />
      </Box>
    </Layout>
  );
}

export default Bookings;
