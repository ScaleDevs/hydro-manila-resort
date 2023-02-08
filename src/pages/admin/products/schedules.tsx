import Head from 'next/head';
import Link from 'next/link';
import { Box, Button, HStack, Text } from '@chakra-ui/react';

import Layout from '@/layouts/admin';
import TableProducts from '@/modules/products/TableProducts';

function Products() {
  return (
    <Layout>
      <Head>
        <title>Admin | Schedules</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
        <HStack>
          <Link href='/admin/products/create'>
            <Button borderRadius='full' h='50px' w='50px' fontSize='25px' fontWeight='normal'>
              +
            </Button>
          </Link>
          <Text fontWeight='semibold' fontSize='18px'>
            Product
          </Text>
        </HStack>

        <br />

        <TableProducts />
      </Box>
    </Layout>
  );
}

export default Products;
