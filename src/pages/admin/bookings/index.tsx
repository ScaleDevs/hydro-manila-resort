import Head from 'next/head';
import Link from 'next/link';
import { Box, Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, Button, Stack } from '@chakra-ui/react';
import { BiPlus } from 'react-icons/bi';
import Layout from '@/layouts/admin';
import TableBookingRecords from '@/modules/booking/TableBookingRecords';
import { GetApp } from '@/appspecs/theme';

function Bookings() {
  return (
    <Layout>
      <Head>
        <title>Admin | Bookings</title>
        <meta name='description' content='admin bookings module' />
        <link rel='icon' href={GetApp.Favicon} />
      </Head>

      <Stack w='full' direction='row' justify='space-between'>
        <Breadcrumb fontFamily='primary' color={GetApp.ActiveColor} fontWeight='medium'>
          <BreadcrumbItem isCurrentPage>
            <BreadcrumbSeparator />
            <BreadcrumbLink>Bookings</BreadcrumbLink>
          </BreadcrumbItem>
        </Breadcrumb>

        <Link href='/admin/bookings/create'>
          <Button>
            <BiPlus />
          </Button>
        </Link>
      </Stack>

      <br />

      <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
        <TableBookingRecords />
      </Box>
    </Layout>
  );
}

export default Bookings;
