import * as React from 'react';
import Head from 'next/head';
import { Box } from '@chakra-ui/react';

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
        <TableScheduledEvent />
      </Box>
    </Layout>
  );
}

export default ScheduledEvent;
