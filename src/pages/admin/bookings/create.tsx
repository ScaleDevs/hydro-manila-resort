import { useRouter } from 'next/router';
import Head from 'next/head';
import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, Stack } from '@chakra-ui/react';
import Layout from '@/layouts/admin';
import { BookingForm } from '@/modules/booking/BookingForm/BookingForm';
import { GetApp } from '@/appspecs/theme';

function Page() {
  const router = useRouter();

  return (
    <Layout>
      <Head>
        <title>Admin | Create Booking</title>
        <meta name='description' content='admin create booking' />
        <link rel='icon' href={GetApp.Favicon} />
      </Head>

      <Stack w='full'>
        <Breadcrumb fontFamily='primary' color={GetApp.ActiveColor} fontWeight='medium'>
          <BreadcrumbItem onClick={() => router.push('/admin/bookings')}>
            <BreadcrumbSeparator />
            <BreadcrumbLink>Bookings</BreadcrumbLink>
          </BreadcrumbItem>

          <BreadcrumbItem isCurrentPage>
            <BreadcrumbLink href='#'>create</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>
      </Stack>

      <br />

      <Box w={{ base: '100%', sm: '90%', lg: '1000px' }} mx='auto'>
        <BookingForm fromAdmin />
        <br />
        <br />
        <br />
      </Box>
    </Layout>
  );
}

export default Page;
