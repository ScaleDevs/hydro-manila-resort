import * as React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Heading, VStack, Text, Image, Box, Button, Spinner, Stack } from '@chakra-ui/react';
import { trpc } from '@/utils/trpc';

const Component = ({ payment_intent_id }: { payment_intent_id: string }) => {
  const { data, isLoading } = trpc.payment.getPaymentIntentSession.useQuery({ paymentIntentId: payment_intent_id as string });

  const retryPayment = () => {
    if (data && data.attributes.next_action?.redirect?.url) window.location.href = data.attributes.next_action.redirect.url;
  };

  return (
    <>
      <Head>
        <title>Booking | Status</title>
        <meta name='description' content='checking the status of booking' />
        <link rel='icon' href='/favicon.ico' />
      </Head>
      <Box h='100vh'>
        <VStack spacing={10}>
          <Box marginBottom={{ base: '-100px', md: '-150px' }}>
            <Image
              src='/logo_blue.png'
              alt='Hydro Resort Logo'
              h={{ base: '350px', md: '500px' }}
              w={{ base: '350px', md: '500px' }}
              marginTop={{ base: '-30px', xl: '-60px' }}
            />
          </Box>

          {isLoading && (
            <Stack justifyContent='center' alignItems='center' spacing={5}>
              <Text fontSize='x-large'>Resolving Payment</Text>
              <Spinner />
            </Stack>
          )}

          {data?.attributes.status === 'awaiting_next_action' && (
            <Button bg='primary.1' borderRadius='sm' size='lg' onClick={retryPayment}>
              RETRY PAYMENT!
            </Button>
          )}

          {data?.attributes.status === 'succeeded' && (
            <Box bg='primary.1' p='20px' borderRadius='sm'>
              <Heading color='white' as='h1'>
                PAYMENT COMPLETE!
              </Heading>
            </Box>
          )}
          {data?.attributes.status === 'succeeded' && (
            <Box w='90%'>
              <Text mt='10px' textAlign='center'>
                You should receive an email within a few minutes regarding your booking confirmation.
              </Text>
              <Text mt='5px' textAlign='center'>
                If you have not receive any email after waiting long then kindly contact our team at hydroresort.manila@gmail.com
                to confirm your booking schedule.
              </Text>
            </Box>
          )}
        </VStack>
      </Box>
    </>
  );
};

export default function SuccessPayment() {
  const router = useRouter();

  if (!router.query.payment_intent_id) return '';

  return <Component payment_intent_id={router.query.payment_intent_id as string} />;
}
