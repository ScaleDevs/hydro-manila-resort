import Head from 'next/head';
import { Box, chakra } from '@chakra-ui/react';
import Layout from '@/layouts/admin';
import { IoSettingsOutline } from 'react-icons/io5';
import BookingSetting from '@/modules/booking/BookingSettingForm';

const SettingIcon = chakra(IoSettingsOutline);

function Admin() {
  return (
    <Layout>
      <Head>
        <title>Home</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Box w='100%' mx='auto'>
        <SettingIcon h='30px' w='30px' _hover={{ cursor: 'pointer', color: 'teal.500' }} transition='color 0.25s' />
        <br />
        <BookingSetting />
      </Box>
    </Layout>
  );
}

export default Admin;
