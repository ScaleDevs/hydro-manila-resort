import Head from 'next/head';
import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, Stack } from '@chakra-ui/react';
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

      <Stack w='full'>
        <Breadcrumb fontFamily='primary' color={GetApp.ActiveColor} fontWeight='medium'>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbSeparator />
            <BreadcrumbLink>Bookings</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Stack>

      <br />

      <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
        <TableBookingRecords />
      </Box>
    </Layout>
  );
}

export default Bookings;
