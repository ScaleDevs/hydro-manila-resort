import * as React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Box, Button, HStack, Text } from '@chakra-ui/react';

import Layout from '@/layouts/admin';
import TableScheduledEvent from '@/modules/events/TableScheduledEvents';

function ScheduledEvent() {
  return (
    <Layout>
      <Head>
        <title>Admin | Scheduled Event</title>
        <meta name='description' content='Sample Home page with nextjs' />
        <link rel='icon' href='/favicon.ico' />
      </Head>

      <Box w='100%' mx='auto' bg='gray.50' p='25px' boxShadow='xl' borderRadius='sm'>
        <HStack>
          <Link href='/admin/events/create'>
            <Button borderRadius='full' h='50px' w='50px' fontSize='25px' fontWeight='normal'>
              +
            </Button>
          </Link>
          <Text fontWeight='semibold' fontSize='18px'>
            Scheduled Event
          </Text>
        </HStack>

        <br />

        <TableScheduledEvent />
      </Box>
    </Layout>
  );
}

export default ScheduledEvent;
