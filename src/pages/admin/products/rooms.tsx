import Head from 'next/head';
import Link from 'next/link';
import { Box, Button, HStack, Text } from '@chakra-ui/react';

import Layout from '@/layouts/admin';
import TableRooms from '@/modules/rooms/TableRooms';

function Products() {
  return (
    <Layout>
      <Head>
        <title>Home</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Box w='100%' mx='auto'>
        <HStack>
          <Link href='/admin/products/create-rooms'>
            <Button borderRadius='full' h='50px' w='50px' fontSize='25px' fontWeight='normal'>
              +
            </Button>
          </Link>
          <Text fontWeight='semibold' fontSize='18px'>
            ROOMS
          </Text>
        </HStack>

        <br />

        <TableRooms />
      </Box>
    </Layout>
  );
}

export default Products;
